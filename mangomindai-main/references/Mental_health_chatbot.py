## imports 
from typing import TypedDict, List
from langchain_openai import ChatOpenAI

from langchain_core.prompts import ChatPromptTemplate
from langchain_core.messages import HumanMessage, AIMessage, BaseMessage

from langgraph.graph import StateGraph, END

from flask import Flask, request, jsonify,render_template
from dotenv import load_dotenv
from langgraph.checkpoint.memory import MemorySaver
load_dotenv()
app = Flask(__name__)

##LLM 
llm = ChatOpenAI(model="gpt-4o-mini")


##Graphstate
class Graphstate(TypedDict):
    question : str
    classifier : str
    answer : str
    messages : List[BaseMessage]


##Prompt
query_classifier_prompt = ChatPromptTemplate.from_messages([
    ("system",
     """You are a query classifier for a mental health chat bot. 

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
    """),
    ("human","{question}")
])

## Defining the agents

def call_llm(user_question, promt):
    chain = promt | llm
    response = chain.invoke(user_question)
    return response.content.strip()

##Agent 0
def query_classifier_node(state:Graphstate):
    user_question = state["question"].lower()
    classifier = call_llm(user_question,query_classifier_prompt)
    print(classifier)
    return {"classifier":classifier}

## Agent 1 

emergency_detect_prompt = ChatPromptTemplate.from_messages([
    ("system",
     """You are a emergency node for a mental health chat bot.

     You job is to calm the user and resolve the emergency.
    Steps you should follow :
    1. Calm the user
    2. Provide the emergancy contact number the user needs. Ex: 911
    3. Provide immediate methods the user could use to maintain their mental stability
    4. Ask the user for updates on there situation.
    

    Notes:
    1. Be clear and supportive
    2. Don't say anything sensitive 
    3. Remember this is an emergency
    4. Don't provide any medication suggestion in any way. Encourage them to see a doctor if serious medication is needed.
    """),
    ("human","{question}")

]
)

def emergency_node(state:Graphstate):
    user_question = state["question"].lower()

    answer = call_llm(user_question,emergency_detect_prompt)

    return{"answer": answer}


##Agent 2
general_questions_prompt = ChatPromptTemplate.from_messages([
    ("system",
     """You are a general question node for a mental health chat bot.

     You job is to repsond to any general mental health question the user asks.
    Steps you should follow :
    1. Answer the question directly. 
    2. Provide the user with some follow up question and additional information you could provide
    

    Notes:
    1. Be clear and supportive
    2. Don't say anything sensitive 
    3. You are not allowed to provide or suggest medication of any form. If the user asks for medication advice tell them to refer to a real doctor.

    """),
    ("human","{question}")

]
)

def general_questions_node(state:Graphstate):
    user_question = state["question"].lower()

    answer = call_llm(user_question,general_questions_prompt)

    return{"answer": answer}


##Agent 3
suggestion_agent_prompt = ChatPromptTemplate.from_messages([
    ("system",
     """You are a suggestion agent node for a mental health chat bot.

     You job is to repsond to any mental health methods/suggestions related questions
    Steps you should follow :
    1. Provide the user clearly with the best method you can find in their situation.
    2. Provide the user with some follow up question and additional methods you could provide.
    

    Notes:
    1. Be clear with the steps you provide(dont rush and be patient) and supportive 
    2. Don't say anything sensitive 
    3. You are not allowed to provide or suggest medication of any form. If the user asks for medication advice tell them to refer to a real doctor.

    """),
    ("human","{question}")

]
)

def suggestion_agent_node(state:Graphstate):
    user_question = state["question"].lower()

    answer = call_llm(user_question,suggestion_agent_prompt)

    return{"answer": answer}


## Agent 4
emotional_support_prompt = ChatPromptTemplate.from_messages([
    ("system",
     """You are a emotional support node for a mental health chat bot.

     You job is to act like a normal human and provide them emotional support they need.
    Steps you should follow :
    1. Listen to what the user wants and always be supportive.
    2. Have a casual conversation and don't dump heavy information on the user
    3. Ask follow up question to better understand the user situation.
    

    Notes:
    1. Be clear with the steps you provide(dont rush and be patient) and supportive 
    2. Don't say anything sensitive 
    3. You are not allowed to provide or suggest medication of any form. If the user asks for medication advice tell them to refer to a real doctor.
    4. Act more like a friend then a professional dumping information on the user

    """),
    ("human","{question}")

]
)

def emotional_support_node(state:Graphstate):
    user_question = state["question"].lower()

    answer = call_llm(user_question,emotional_support_prompt)

    return{"answer": answer}

## Agent 5
life_style_support_prompt = ChatPromptTemplate.from_messages([
    ("system",
     """You are a life style support node for a mental health chat bot.

     You job is to answer any question related to lifestyle
    Steps you should follow :   
    1. Answer the question directly. Provide some suggestion and information
    2. Provide the user with some follow up question and additional information you could provide
    3. Only respond with lifestyle related informations and dont go beyond the topic. 
    

    Notes:
    1. Be clear with the steps you provide(dont rush and be patient) and supportive 
    2. Don't say anything sensitive 
    3. You are not allowed to provide or suggest medication of any form. If the user asks for medication advice tell them to refer to a real doctor.
    4. Act more like a friend then a professional dumping information on the user

    """),
    ("human","{question}")

]
)

def life_style_support_node(state:Graphstate):
    user_question = state["question"].lower()

    answer = call_llm(user_question,emotional_support_prompt)

    return{"answer": answer}

## Agent 6
Fallback_prompt = ChatPromptTemplate.from_messages([
    ("system",
     """You are a fall back node of a mental health chatbot

     You job is to greet the user and tell them you cant answer questions unrelated to mentalhealth. 
    Steps you should follow :   
    1. If the user question includes a greeting you should greet them as well.
    2. If the user question is unrelated to mental health simply tell them " I am a mental health chatbot, so I specialize in mental health questions"
    3. Provide user with some basic information on their query
    

    Notes:
    1. Remember you are a mental health chat bot. 
    


    """),
    ("human","{question}")

]
)

def Fallback_node(state:Graphstate):
    user_question = state["question"].lower()

    answer = call_llm(user_question,Fallback_prompt)

    return{"answer": answer}


def route(state:Graphstate):
    classifier = state["classifier"]

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
    

graph = StateGraph(Graphstate)

graph.add_node("emergency", emergency_node)
graph.add_node("query_classifier", query_classifier_node)
graph.add_node("general_questions", general_questions_node)
graph.add_node("suggestion_agent", suggestion_agent_node)
graph.add_node("emotional_support", emotional_support_node)
graph.add_node("life_style_support", life_style_support_node)
graph.add_node("Fallback", Fallback_node)

graph.set_entry_point("query_classifier")


graph.add_conditional_edges(
    "query_classifier",
    route,
    {
    "emergency" :"emergency",
    "general_questions" :"general_questions",
    "suggestion_agent" :"suggestion_agent",
    "emotional_support" :"emotional_support",
    "life_style_support" :"life_style_support",
    "Fallback" :"Fallback"
    }
)



graph.add_edge("general_questions", END)
graph.add_edge("emergency", END)
graph.add_edge("suggestion_agent", END)
graph.add_edge("life_style_support", END)
graph.add_edge("emotional_support", END)
graph.add_edge("Fallback", END)


mental_health_graph = graph.compile()

@app.route("/")
def home():
    return render_template("chatbot.html")

@app.route("/ask", methods=["POST"])
def ask():
    user_message = request.form.get("message")
    result = mental_health_graph.invoke({
        "question": user_message,
        "messages": []
    })
    return jsonify({"reply" : result["answer"]})

    

if __name__== "__main__":
    app.run(debug=False)