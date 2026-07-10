from typing import TypedDict, List
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.messages import HumanMessage, AIMessage, BaseMessage
from langgraph.checkpoint.memory import MemorySaver
from langgraph.graph import StateGraph, END
from fastapi import FastAPI, Request, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
import os
import time
from collections import defaultdict
from dotenv import load_dotenv
from utilities.logger_QA import logger

load_dotenv()

_openai_key = os.getenv("OPENAI_API_KEY")
if not _openai_key:
    raise RuntimeError("OPENAI_API_KEY is not set. Add it to your .env file before starting the server.")

app = FastAPI()

_allowed_origins = [o for o in [
    os.getenv("FRONTEND_ORIGIN"),
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

_rate_store: dict = defaultdict(list)
_RATE_LIMIT = 20
_RATE_WINDOW = 60

llm = ChatOpenAI(model="gpt-4o-mini")


# ── Shared ────────────────────────────────────────────────────────────────────

class GraphState(TypedDict):
    question: str
    classifier: str
    answer: str
    messages: List[BaseMessage]
    summary: str


def call_llm(state, prompt):
    chain = prompt | llm
    response = chain.invoke({
        "question": state["question"],
        "messages": state.get("messages", []),
        "summary": state.get("summary", ""),
    })
    return response.content.strip()


def _check_rate_limit(user_id: str):
    now = time.time()
    timestamps = _rate_store[user_id]
    _rate_store[user_id] = [t for t in timestamps if now - t < _RATE_WINDOW]
    if len(_rate_store[user_id]) >= _RATE_LIMIT:
        raise HTTPException(status_code=429, detail="Too many requests. Please wait a moment.")
    _rate_store[user_id].append(now)


# ── Mental Health Graph ────────────────────────────────────────────────────────

mh_classifier_prompt = ChatPromptTemplate.from_messages([
("system",
"""You are a query classifier for a student-focused mental health chatbot.
Before anything: read the conversation summary to understand the user's background and prior context.

Classify the user question into ONE of:
1. emergency         -- serious emergency e.g. self-harm or suicide
2. general_questions -- general mental health question
3. suggestion_agent  -- asking for specific coping methods or relief
4. emotional_support -- casual chat or needing emotional support
5. life_style_support -- lifestyle-related questions
6. Fallback          -- unrelated to mental health

Rules:
- Return ONLY the category name, no explanation.
- Any mention of self-harm or suicide → always emergency.
- Consider school stress, exams, burnout, procrastination as mental health context.
"""),
MessagesPlaceholder(variable_name="messages"),
("human", "{question}")
])

mh_summary_prompt = ChatPromptTemplate.from_messages([
("system",
"""Summarize the conversation briefly so future questions can be answered with context.
Focus on: mental health issues discussed, user's goal, school/social situation.
Keep it under 3 sentences.
"""),
("human", "{messages}")
])

mh_general_prompt = ChatPromptTemplate.from_messages([
("system",
"""You are a general question node for a student-focused mental health chatbot.
Before anything: read the conversation summary for context.

Steps:
1. Answer the question directly.
2. Offer a relevant follow-up or next step if helpful.

Rules:
- Be clear and supportive. Do not suggest medication; refer to a doctor if asked.
- Keep responses concise. Always consider student/academic context.
"""),
MessagesPlaceholder(variable_name="messages"),
("human", "{question}")
])

mh_emergency_prompt = ChatPromptTemplate.from_messages([
("system",
"""You are an emergency node for a student-focused mental health chatbot.
Before anything: read the conversation summary for context.

Steps:
1. Immediately acknowledge the seriousness and provide calm support.
2. Share emergency contacts (911, 988 Suicide & Crisis Lifeline).
3. Offer immediate grounding techniques.
4. Ask if the user is safe.

Rules:
- Be clear, calm, and supportive. Never suggest medication.
"""),
MessagesPlaceholder(variable_name="messages"),
("human", "{question}")
])

mh_suggestion_prompt = ChatPromptTemplate.from_messages([
("system",
"""You are a suggestion agent for a student-focused mental health chatbot.
Before anything: read the conversation summary for context.

Steps:
1. Provide 1-3 actionable coping methods a student could use today (mix short- and long-term).
2. Offer follow-up questions or future strategies.

Rules:
- Be patient and supportive. No medication suggestions; refer to a doctor if asked.
- Keep suggestions realistic for a student. Tone: friendly mentor.
"""),
MessagesPlaceholder(variable_name="messages"),
("human", "{question}")
])

mh_emotional_prompt = ChatPromptTemplate.from_messages([
("system",
"""You are an emotional support node for a student-focused mental health chatbot.
Before anything: read the conversation summary for context.

Steps:
1. Listen and validate the user's feelings.
2. Have a casual, warm conversation without dumping heavy information.
3. Ask follow-up questions to understand their situation better.

Rules:
- Be conversational and genuine, more friend than therapist. No medication suggestions.
"""),
MessagesPlaceholder(variable_name="messages"),
("human", "{question}")
])

mh_lifestyle_prompt = ChatPromptTemplate.from_messages([
("system",
"""You are a lifestyle support node for a student-focused mental health chatbot.
Before anything: read the conversation summary for context.

Steps:
1. Answer lifestyle questions with practical suggestions.
2. Offer follow-up information tied to the student's mental well-being.

Rules:
- Be friendly and supportive. No medication suggestions. Always consider student context.
"""),
MessagesPlaceholder(variable_name="messages"),
("human", "{question}")
])

mh_fallback_prompt = ChatPromptTemplate.from_messages([
("system",
"""You are a fallback node for a student-focused mental health chatbot.
If the question is a greeting, respond warmly then steer back to mental health topics.
If unrelated to mental health, politely say you only cover mental health questions.
"""),
MessagesPlaceholder(variable_name="messages"),
("human", "{question}")
])


def _mh_update_messages(state, answer):
    return state.get("messages", []) + [
        HumanMessage(content=state["question"]),
        AIMessage(content=answer),
    ]


def mh_classifier_node(state: GraphState):
    logger.info("---- MH CLASSIFIER ----")
    classifier = call_llm(state, mh_classifier_prompt)
    logger.info("MH CLASSIFIER --> %s", classifier)
    return {"classifier": classifier}


def mh_general_node(state: GraphState):
    logger.info("---- MH GENERAL QA ----")
    answer = call_llm(state, mh_general_prompt)
    return {"answer": answer, "messages": _mh_update_messages(state, answer)}


def mh_emergency_node(state: GraphState):
    logger.info("---- MH EMERGENCY ----")
    answer = call_llm(state, mh_emergency_prompt)
    return {"answer": answer, "messages": _mh_update_messages(state, answer)}


def mh_suggestion_node(state: GraphState):
    logger.info("---- MH SUGGESTION ----")
    answer = call_llm(state, mh_suggestion_prompt)
    return {"answer": answer, "messages": _mh_update_messages(state, answer)}


def mh_emotional_node(state: GraphState):
    logger.info("---- MH EMOTIONAL SUPPORT ----")
    answer = call_llm(state, mh_emotional_prompt)
    return {"answer": answer, "messages": _mh_update_messages(state, answer)}


def mh_lifestyle_node(state: GraphState):
    logger.info("---- MH LIFESTYLE ----")
    answer = call_llm(state, mh_lifestyle_prompt)
    return {"answer": answer, "messages": _mh_update_messages(state, answer)}


def mh_fallback_node(state: GraphState):
    logger.info("---- MH FALLBACK ----")
    answer = call_llm(state, mh_fallback_prompt)
    return {"answer": answer, "messages": _mh_update_messages(state, answer)}


def mh_memory_node(state: GraphState):
    logger.info("---- MH MEMORY SUMMARIZER ----")
    messages = state.get("messages", [])
    if len(messages) < 8:
        return {}
    chain = mh_summary_prompt | llm
    summary = chain.invoke({"messages": "\n".join([m.content for m in messages])}).content
    logger.info("MH SUMMARY --> %s", summary)
    return {"summary": summary, "messages": messages[-4:]}


def mh_route(state: GraphState):
    c = state["classifier"]
    logger.info("MH ROUTING --> %s", c)
    if c == "emergency":
        return "emergency"
    elif c == "general_questions":
        return "general_questions"
    elif c == "suggestion_agent":
        return "suggestion_agent"
    elif c == "emotional_support":
        return "emotional_support"
    elif c == "life_style_support":
        return "life_style_support"
    return "Fallback"


_mh_graph = StateGraph(GraphState)
_mh_graph.add_node("query_classifier", mh_classifier_node)
_mh_graph.add_node("emergency", mh_emergency_node)
_mh_graph.add_node("general_questions", mh_general_node)
_mh_graph.add_node("suggestion_agent", mh_suggestion_node)
_mh_graph.add_node("emotional_support", mh_emotional_node)
_mh_graph.add_node("life_style_support", mh_lifestyle_node)
_mh_graph.add_node("Fallback", mh_fallback_node)
_mh_graph.add_node("memory_summarizer", mh_memory_node)
_mh_graph.set_entry_point("query_classifier")
_mh_graph.add_conditional_edges("query_classifier", mh_route, {
    "emergency": "emergency",
    "general_questions": "general_questions",
    "suggestion_agent": "suggestion_agent",
    "emotional_support": "emotional_support",
    "life_style_support": "life_style_support",
    "Fallback": "Fallback",
})
for _node in ["emergency", "general_questions", "suggestion_agent", "emotional_support", "life_style_support", "Fallback"]:
    _mh_graph.add_edge(_node, "memory_summarizer")
_mh_graph.add_edge("memory_summarizer", END)
mental_health_graph = _mh_graph.compile(checkpointer=MemorySaver())


# ── Sports Graph ───────────────────────────────────────────────────────────────

sports_classifier_prompt = ChatPromptTemplate.from_messages([
("system",
"""You are a query classifier for a sports analytics chatbot.
Use conversation history to understand follow-up questions.
If the current question depends on prior sports context, classify accordingly.

Classify into ONE of:
- general_sports_qa  -- sports rules, players, teams, history, fitness
- future_predict     -- match outcome predictions
- sports_coach       -- learning a sport, training, drills, techniques
- fall_back          -- unrelated to sports

Rules:
- Return ONLY the category name.
- "Teach me / how to improve / train / practice" → always sports_coach.
"""),
MessagesPlaceholder(variable_name="messages"),
("human", "{question}")
])

sports_summary_prompt = ChatPromptTemplate.from_messages([
("system",
"""Summarize the conversation briefly for future context.
Focus on: sport discussed, player/team/topic, user's goal (training, analytics, etc).
Keep it under 3 sentences.
"""),
("human", "{messages}")
])

sports_general_prompt = ChatPromptTemplate.from_messages([
("system",
"""You are a sports expert.
Answer general questions about sports knowledge, rules, regulations, and health/fitness.
Be clear, factual, and concise.
"""),
MessagesPlaceholder(variable_name="messages"),
("human", "{question}")
])

sports_predict_prompt = ChatPromptTemplate.from_messages([
("system",
"""You are a sports analytics expert.
Rules:
- Only predict if sufficient data is provided; state assumptions clearly.
- Use probabilistic language; avoid guarantees.
- If data is insufficient, say so clearly.
"""),
MessagesPlaceholder(variable_name="messages"),
("human", "{question}")
])

sports_coach_prompt = ChatPromptTemplate.from_messages([
("system",
"""You are a professional sports coach.
Provide: sport explanations, step-by-step guidance, beginner-friendly instructions, safety tips.
Keep the tone encouraging, supportive, and practical.
"""),
MessagesPlaceholder(variable_name="messages"),
("human", "{question}")
])

sports_fallback_prompt = ChatPromptTemplate.from_messages([
("system",
"""You are a guardrail agent for a sports chatbot.
If the question is a greeting, respond warmly then steer back to sports topics.
If unrelated to sports, politely refuse and say you only answer sports-related questions.
"""),
MessagesPlaceholder(variable_name="messages"),
("human", "{question}")
])


def _sports_update_messages(state, answer):
    return state.get("messages", []) + [
        HumanMessage(content=state["question"]),
        AIMessage(content=answer),
    ]


def sports_classifier_node(state: GraphState):
    logger.info("---- SPORTS CLASSIFIER ----")
    classifier = call_llm(state, sports_classifier_prompt)
    logger.info("SPORTS CLASSIFIER --> %s", classifier)
    return {"classifier": classifier}


def sports_general_node(state: GraphState):
    logger.info("---- SPORTS GENERAL QA ----")
    answer = call_llm(state, sports_general_prompt)
    return {"answer": answer, "messages": _sports_update_messages(state, answer)}


def sports_predict_node(state: GraphState):
    logger.info("---- SPORTS PREDICT ----")
    answer = call_llm(state, sports_predict_prompt)
    return {"answer": answer, "messages": _sports_update_messages(state, answer)}


def sports_coach_node(state: GraphState):
    logger.info("---- SPORTS COACH ----")
    answer = call_llm(state, sports_coach_prompt)
    return {"answer": answer, "messages": _sports_update_messages(state, answer)}


def sports_fallback_node(state: GraphState):
    logger.info("---- SPORTS FALLBACK ----")
    answer = call_llm(state, sports_fallback_prompt)
    return {"answer": answer, "messages": _sports_update_messages(state, answer)}


def sports_memory_node(state: GraphState):
    logger.info("---- SPORTS MEMORY SUMMARIZER ----")
    messages = state.get("messages", [])
    if len(messages) < 8:
        return {}
    chain = sports_summary_prompt | llm
    summary = chain.invoke({"messages": "\n".join([m.content for m in messages])}).content
    logger.info("SPORTS SUMMARY --> %s", summary)
    return {"summary": summary, "messages": messages[-4:]}


def sports_route(state: GraphState):
    c = state["classifier"]
    logger.info("SPORTS ROUTING --> %s", c)
    if c == "general_sports_qa":
        return "general_sports_qa"
    elif c == "future_predict":
        return "future_predict"
    elif c == "sports_coach":
        return "sports_coach"
    return "fall_back"


_sports_graph = StateGraph(GraphState)
_sports_graph.add_node("query_classifier", sports_classifier_node)
_sports_graph.add_node("general_sports_qa", sports_general_node)
_sports_graph.add_node("future_predict", sports_predict_node)
_sports_graph.add_node("sports_coach", sports_coach_node)
_sports_graph.add_node("fall_back", sports_fallback_node)
_sports_graph.add_node("memory_summarizer", sports_memory_node)
_sports_graph.set_entry_point("query_classifier")
_sports_graph.add_conditional_edges("query_classifier", sports_route, {
    "general_sports_qa": "general_sports_qa",
    "future_predict": "future_predict",
    "sports_coach": "sports_coach",
    "fall_back": "fall_back",
})
for _node in ["general_sports_qa", "future_predict", "sports_coach", "fall_back"]:
    _sports_graph.add_edge(_node, "memory_summarizer")
_sports_graph.add_edge("memory_summarizer", END)
sports_graph = _sports_graph.compile(checkpointer=MemorySaver())


# ── API Endpoints ──────────────────────────────────────────────────────────────

@app.get("/")
async def health():
    return {"status": "ok", "service": "SportLab AI Backend"}


@app.post("/mental-health/ask")
async def mental_health_ask(request: Request, message: str = Form(...)):
    logger.info("MH QUESTION --> %s", message)
    client_ip = request.client.host if request.client else None
    user_id = request.headers.get("X-User-Id") or request.cookies.get("session_id") or client_ip or "anonymous"
    _check_rate_limit(user_id)
    result = mental_health_graph.invoke(
        {"question": message},
        config={"configurable": {"thread_id": f"mh_{user_id}"}}
    )
    return {"reply": result.get("answer", "")}


@app.post("/sports/ask")
async def sports_ask(request: Request, message: str = Form(...)):
    logger.info("SPORTS QUESTION --> %s", message)
    client_ip = request.client.host if request.client else None
    user_id = request.headers.get("X-User-Id") or request.cookies.get("session_id") or client_ip or "anonymous"
    _check_rate_limit(user_id)
    result = sports_graph.invoke(
        {"question": message},
        config={"configurable": {"thread_id": f"sports_{user_id}"}}
    )
    return {"reply": result.get("answer", "")}
