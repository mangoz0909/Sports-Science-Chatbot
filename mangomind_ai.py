
# 1. Imports & Setup

from typing import TypedDict, List
from langchain_openai import ChatOpenAI

from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.messages import HumanMessage, AIMessage, BaseMessage

from langgraph.checkpoint.memory import MemorySaver

from langgraph.graph import StateGraph, END

from fastapi import FastAPI, Request, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
import json
import os
import time
from collections import defaultdict

from dotenv import load_dotenv

from utilities.logger_QA import logger

load_dotenv()

# Validate required env vars at startup
_openai_key = os.getenv("OPENAI_API_KEY")
if not _openai_key:
    raise RuntimeError("OPENAI_API_KEY is not set. Add it to your .env file before starting the server.")

app = FastAPI()

# Restrict CORS to known frontend origins; extend this list for production deployments
_allowed_origins = [o for o in [
    os.getenv("FRONTEND_ORIGIN"),          # e.g. https://your-app.vercel.app
    "http://localhost:3000",
    "http://localhost:5173",
] if o]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

templates = Jinja2Templates(directory="templates")

# Simple in-memory rate limiter: max 20 requests per minute per user
_rate_store: dict = defaultdict(list)
_RATE_LIMIT = 20
_RATE_WINDOW = 60
if os.path.isdir("static"):
    app.mount("/static", StaticFiles(directory="static"), name="static")

# 2. Config the LLM with api keys
llm = ChatOpenAI(model="gpt-4o-mini")


# 3. Define the Graph State


class GraphState(TypedDict):
    question: str
    classifier: str
    answer: str
    messages: List[BaseMessage]
    summary: str

# PROMPTS
query_classifier_prompt = ChatPromptTemplate.from_messages([
("system",
"""
     You are a query classifier for a student-focused mental health chatbot. 
    Before anything : Read the conversation summary to understand the user's background, situation, and prior context before responding.
    
     You job is to classify the user question and return one from the following list:

     1. emergency -- return this if there is an serious emergency ex: self harm or suicide
     2. general_questions -- return this if the user is asking general mental health related question
     3. suggestion_agent -- return this if the user is asking for specific method to relief/cure. 
     4. emotional_support -- return this if the user is asking to have a casual chat or needs emotional support.
     5. life_style_support -- return this if the user is asking any life_style_related questions
     6. Fallback -- return this if the user question is unrealted to mental health.


    Notes:
    1. You should ONLY return the Category name
    2. Do not provide any explanation
    3. If there is ANY mention of self-harm or suicide always classify as emergency.
    4. Consider school stress, exams, grades, burnout, procrastination, and student life when choosing the category
    5. Also take the summary into consideration when deciding what they user question really wants.
"""),
MessagesPlaceholder(variable_name="messages"),
("human", "{question}")
])

summary_prompt = ChatPromptTemplate.from_messages([
("system",
"""
Summarize the conversation briefly so future
questions can be answered with context.

Focus on:
- mental health issues being discussed
- user's goal (suggestions, strategy etc)
- Focus on whats happening in the users school - such as their grades and social life

Keep it under 3 sentences.
"""),
("human","{messages}")
])

def call_llm(state, prompt):

    chain = prompt | llm

    response = chain.invoke({
        "question": state["question"],
        "messages": state.get("messages", []),
        "summary": state.get("summary", "")
    })

    return response.content.strip()


# Agent 0
def query_classifier_node(state: GraphState):

    logger.info("---- CLASSIFIER NODE ----")

    logger.info("MEMORY BEFORE CLASSIFICATION ---> %s", state.get("messages", []))

    classifier = call_llm(state, query_classifier_prompt)

    logger.info("CLASSIFIER RESULT ---> %s", classifier)

    return {"classifier": classifier}

# Agent 1
general_questions_prompt = ChatPromptTemplate.from_messages([
    ("system",
     """You are a general question node for a student-focused mental health chatbot.

    Before anything : Read the conversation summary to understand the user's background, situation, and prior context before responding.

    Your job is to respond to general mental health questions in a way that is easy for students to understand.
    
    Steps you should follow :
    1. Answer the question directly. 
    2. Provide the user with some follow up question and additional information you could provide(do this only if it will be more helpful)
    3. Instead you could offer a relevant next step.
    

    Notes:
    1. Be clear and supportive
    2. Don't say anything sensitive 
    3. You are not allowed to provide or suggest medication of any form. 
    4. If the user asks for medication advice, tell them to speak with a doctor or licensed mental health professional.
    5. Keep the response helpful but not overly long.
    6. You are a mental health assistant designed specifically for students, so always consider school, academic pressure, and student life in your responses.


"""),
 MessagesPlaceholder(variable_name="messages"),
("human", "{question}")
])

def general_questions_node(state: GraphState):

    logger.info("---- GENERAL QA AGENT ----")

    logger.info("MEMORY RECEIVED ---> %s", state.get("messages", []))

    answer = call_llm(state, general_questions_prompt)

    updated_messages = state.get("messages", []) + [
        HumanMessage(content=state["question"]),
        AIMessage(content=answer)
    ]

    logger.info("UPDATED MEMORY ---> %s", updated_messages)

    logger.info("AGENT RESPONSE ---> %s", answer)

    return {
        "answer": answer,
        "messages": updated_messages
    }

# Agent 2
emergency_detect_prompt = ChatPromptTemplate.from_messages([
    ("system",
 """You are a emergency node for a mental health chat bot.
    Before anything : Read the conversation summary to understand the user's background, situation, and prior context before responding.

    Your job is to respond safely and supportively when a student may be in crisis.
    Steps you should follow :
    1. Provide immediate methods the user could use to maintain their mental stability
    2. Provide the emergancy contact number the user needs. Ex: 911 or 988
    3. Provide immediate methods the user could use to maintain their mental stability
    4. Ask the user if they are safe(or just a general update)
    

    Notes:
    1. Be clear and supportive
    2. Don't say anything sensitive 
    3. Remember this is an emergency
    4. Don't provide any medication suggestion in any way. Encourage them to see a doctor if serious medication is needed.
    5. You are a mental health assistant designed specifically for students, so always consider school, academic pressure, and student life in your responses.

"""),
 MessagesPlaceholder(variable_name="messages"),
("human", "{question}")
])

def emergency_node(state:GraphState):

    logger.info("---- EMERGENCY AGENT ----")

    logger.info("MEMORY RECEIVED ---> %s", state.get("messages", []))

    answer = call_llm(state, emergency_detect_prompt)

    updated_messages = state.get("messages", []) + [
        HumanMessage(content=state["question"]),
        AIMessage(content=answer)
    ]


    logger.info("UPDATED MEMORY ---> %s", updated_messages)

    logger.info("AGENT RESPONSE ---> %s", answer)

    return {
        "answer": answer,
        "messages": updated_messages
    }

# Agent 3

suggestion_agent_prompt = ChatPromptTemplate.from_messages([
    ("system",
   """You are a suggestion agent node for a mental health chat bot.
    Before anything : Read the conversation summary to understand the user's background, situation, and prior context before responding.

    Your job is to respond to students asking for coping methods, strategies, or practical ways to feel better.
    Steps you should follow :
    1. Provide the user clearly with the 1-3 methods a student could do today.(include a mix a log term and short term)
    2. Provide the user with some follow up question and additional methods they could do for the future or longterm
    

    Notes:
    1. Be clear with the steps you provide(dont rush and be patient) and supportive 
    2. Don't say anything sensitive 
    3. You are not allowed to provide or suggest medication of any form. If the user asks for medication advice tell them to refer to a real doctor.
    4. Focus on realistic actions a student could do today, not unpractical long term advice only.
    5. Keep the tone friendly and supportive, like a mentor.
    6. You are a mental health assistant designed specifically for students, so always consider school, academic pressure, and student life in your responses.


"""),
 MessagesPlaceholder(variable_name="messages"),
("human", "{question}")
])

def suggestion_agent_node(state:GraphState):

    logger.info("---- SUGGESTION AGENT ----")

    logger.info("MEMORY RECEIVED ---> %s", state.get("messages", []))

    answer = call_llm(state, suggestion_agent_prompt)

    updated_messages = state.get("messages", []) + [
        HumanMessage(content=state["question"]),
        AIMessage(content=answer)
    ]

    logger.info("UPDATED MEMORY ---> %s", updated_messages)

    logger.info("AGENT RESPONSE ---> %s", answer)

    return {
        "answer": answer,
        "messages": updated_messages
    }

# Agent 4
fall_back_prompt = ChatPromptTemplate.from_messages([
    ("system",
     """You are a fall back node of a mental health chatbot

     You job is to greet the user and tell them you cant answer questions unrelated to mental health. 
    Steps you should follow :   
    1. If the user question includes a greeting you should greet them as well.
    2. If the user question is unrelated to mental health simply tell them " I am a mental health chatbot, so I specialize in mental health questions"
    

    Notes:
    1. Remember you are a mental health chat bot for students. 
    
"""),
 MessagesPlaceholder(variable_name="messages"),
("human", "{question}")
])

def Fallback_node(state:GraphState):

    logger.info("---- FALL BACK AGENT ----")

    logger.info("MEMORY RECEIVED ---> %s", state.get("messages", []))

    answer = call_llm(state, fall_back_prompt)

    updated_messages = state.get("messages", []) + [
        HumanMessage(content=state["question"]),
        AIMessage(content=answer)
    ]

    logger.info("UPDATED MEMORY ---> %s", updated_messages)

    logger.info("AGENT RESPONSE ---> %s", answer)

    return {
        "answer": answer,
        "messages": updated_messages
    }

def memory_summarizer_node(state: GraphState):

    logger.info("---- MEMORY SUMMARIZER AGENT ----")

    messages = state.get("messages", [])

    if len(messages) < 8:
        return {}

    chain = summary_prompt | llm

    conversation_text = "\n".join([m.content for m in messages])

    summary = chain.invoke({
        "messages": conversation_text
    }).content

    logger.info("SUMMARY UPDATED ---> %s", summary)

    return {
        "summary": summary,
        "messages": messages[-4:]
    }


#Agent 6
emotional_support_prompt = ChatPromptTemplate.from_messages([
    ("system",
    """Your job is to provide warm, supportive conversation for students who are stressed, overwhelmed, sad.
    Before anything : Read the conversation summary to understand the user's background, situation, and prior context before responding.


     You job is to sound natural, warm and provide them emotional support they need.
    Steps you should follow :
    1. Listen to what the user wants and always be supportive.
    2. Have a casual conversation and don't dump heavy information on the user
    3. Ask follow up question to better understand the user situation.
    

    Notes:
    1. Be clear with the steps you provide(dont rush and be patient) and supportive 
    2. Don't say anything sensitive 
    3. You are not allowed to provide or suggest medication of any form. If the user asks for medication advice tell them to refer to a real doctor.
    4. Be conversational and emotionally supportive, without sounding too fake. Try acting like a friend more than therapist. 
    5.You are a mental health assistant designed specifically for students, so always consider school, academic pressure, and student life in your responses.


"""),
 MessagesPlaceholder(variable_name="messages"),
("human", "{question}")
])

def emotional_support_node(state:GraphState):

    logger.info("---- EMOTIONAL SUPPORT AGENT ----")

    logger.info("MEMORY RECEIVED ---> %s", state.get("messages", []))

    answer = call_llm(state, emotional_support_prompt)

    updated_messages = state.get("messages", []) + [
        HumanMessage(content=state["question"]),
        AIMessage(content=answer)
    ]

    logger.info("UPDATED MEMORY ---> %s", updated_messages)

    logger.info("AGENT RESPONSE ---> %s", answer)

    return {
        "answer": answer,
        "messages": updated_messages
    }
# Agent 7
life_style_support_prompt = ChatPromptTemplate.from_messages([
    ("system",
     """Your job is to answer questions related to lifestyle habits that affect a student's mental well-being.

    Before anything : Read the conversation summary to understand the user's background, situation, and prior context before responding.

     You job is to answer any question related to lifestyle
    Steps you should follow :   
    1. Answer the question directly. Provide some suggestion and information
    2. Provide the user with some follow up question and additional information you could provide
    3. Focus on lifestyle habits while keeping the student's mental well-being in mind
    

    Notes:
    1. Be clear with the steps you provide(dont rush and be patient) and supportive 
    2. Don't say anything sensitive 
    3. You are not allowed to provide or suggest medication of any form. If the user asks for medication advice tell them to refer to a real doctor.
    4. Act more like a friend then a professional dumping information on the user
    5. You are a mental health assistant designed specifically for students, so always consider school, academic pressure, and student life in your responses.


"""),
 MessagesPlaceholder(variable_name="messages"),
("human", "{question}")
])

def life_style_support_node(state:GraphState):

    logger.info("---- LIFESTYLE SUPPORT AGENT ----")

    logger.info("MEMORY RECEIVED ---> %s", state.get("messages", []))

    answer = call_llm(state, life_style_support_prompt)

    updated_messages = state.get("messages", []) + [
        HumanMessage(content=state["question"]),
        AIMessage(content=answer)
    ]

    logger.info("UPDATED MEMORY ---> %s", updated_messages)

    logger.info("AGENT RESPONSE ---> %s", answer)

    return {
        "answer": answer,
        "messages": updated_messages
    }
# Router
def route(state: GraphState):

    classifier = state["classifier"]

    logger.info("ROUTING DECISION ---> %s", classifier)

    if classifier == "emergency":
        return "emergency"
    elif classifier == "general_questions":
        return "general_questions"
    elif classifier == "suggestion_agent":
        return "suggestion_agent"
    elif classifier == "emotional_support":
        return "emotional_support"
    elif classifier == "life_style_support":
        return "life_style_support"
    else: 
        return "Fallback"
                

# ===============================
# 5. Compile all agents Build LangGraph
# ===============================
# Create end points
graph = StateGraph(GraphState)

graph.add_node("emergency", emergency_node)
graph.add_node("query_classifier", query_classifier_node)
graph.add_node("general_questions", general_questions_node)
graph.add_node("suggestion_agent", suggestion_agent_node)
graph.add_node("emotional_support", emotional_support_node)
graph.add_node("life_style_support", life_style_support_node)
graph.add_node("memory_summarizer", memory_summarizer_node)
graph.add_node("Fallback", Fallback_node)
# set the entry point
graph.set_entry_point("query_classifier")

# create the conditional edges
graph.add_conditional_edges(
    "query_classifier", # this is 1st step where we get question category
    route, # this is where we use agent route to pass the question to right agent
    {
        "emergency" :"emergency",
        "general_questions" :"general_questions",
        "suggestion_agent" :"suggestion_agent",
        "emotional_support" :"emotional_support",
        "life_style_support" :"life_style_support",
        "Fallback" :"Fallback"
    }
)

# connect the edges
graph.add_edge("emergency", "memory_summarizer")
graph.add_edge("general_questions", "memory_summarizer")
graph.add_edge("suggestion_agent", "memory_summarizer")
graph.add_edge("emotional_support", "memory_summarizer")
graph.add_edge("life_style_support", "memory_summarizer")
graph.add_edge("Fallback", "memory_summarizer")


graph.add_edge("memory_summarizer", END)

memory = MemorySaver()

# Compile
mental_health_graph = graph.compile(checkpointer=memory)


# API Endpoints
@app.get("/", response_class=HTMLResponse)
async def home(request: Request):

    return templates.TemplateResponse(
        "Mental_Health.html",
        {"request": request}
    )

@app.post("/ask")
async def ask(request: Request, message: str = Form(...)):

    logger.info("USER QUESTION ---> %s", message)

    user_id = request.headers.get("X-User-Id") or request.cookies.get("session_id") or "anonymous"

    # Rate limiting
    now = time.time()
    timestamps = _rate_store[user_id]
    _rate_store[user_id] = [t for t in timestamps if now - t < _RATE_WINDOW]
    if len(_rate_store[user_id]) >= _RATE_LIMIT:
        raise HTTPException(status_code=429, detail="Too many requests. Please wait a moment before sending another message.")
    _rate_store[user_id].append(now)
    config = {
        "configurable": {
            "thread_id": f"user_{user_id}"
        }
    }

    result = mental_health_graph.invoke(
        {"question": message},
        config=config
    )

    return {
        "reply": result.get("answer", "")
    }