from operator import itemgetter
from langchain_openai import ChatOpenAI, OpenAIEmbeddings
from langchain_community.document_loaders import PyPDFLoader
from langchain_community.vectorstores import FAISS
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.prompts import ChatPromptTemplate
from dotenv import load_dotenv
from langchain_community.chat_message_histories import ChatMessageHistory

import os
from flask import Flask, render_template, request, jsonify
app = Flask(__name__)


load_dotenv()

##LLM
llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)
question_rewriter_llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)


##load documents
loader = PyPDFLoader("Introduction_RAG_GenAI_Application.pdf")
documents = loader.load()

##Splitter object
splitter = RecursiveCharacterTextSplitter(

chunk_size=500,

chunk_overlap = 50

)

##split the document into chunks
chunks = splitter.split_documents(documents)

embeddings = OpenAIEmbeddings()

##Storing the chunks into vector
vectorstore = FAISS.from_documents(chunks, embeddings)
retriever = vectorstore.as_retriever(search_kwargs={"k": 6})

def format_docs(docs):
   return "\n\n".join(d.page_content for d in docs)


prompt = ChatPromptTemplate.from_template(
   """
You are a helpful assistant.
Answer using from the context, if the information is not sufficient then search online.
You may summarize or infer the main topic if it is clearly implied.
If the question is form of greeting, make sure to greet user with saying 'Hi!, How I can help you'
If the answer cannot be derived from the context, say "I don't know" but make sure you check context for answer.
If the question is irrelevant, search online and tell the user that it was not possible to answer from the documents given and you had to search online.

Context:
{context}


Question:
{question}
"""
)


rag_chain = (
   {
       "context": itemgetter("question") | retriever | format_docs,
       "question": itemgetter("question"),
   }
   | prompt
   | llm
)


rewrite_prompt = ChatPromptTemplate.from_template(
"""
You are rewriting user questions for a document-based QA system.


Goal:
Turn vague follow-up questions into explicit, standalone questions
that can be used for document retrieval.


Rules:
- If the question is vague (e.g., "give examples", "explain more", "why"),
 rewrite it to explicitly state *what* the examples/explanation are about,
 using the conversation history.
- Focus on concepts explained in the document.
- Do NOT add information not present in the history.


Conversation history:
{history}


Latest user question:
{question}
"""
)


rewrite_chain = rewrite_prompt | question_rewriter_llm

# print("\n📄 Document QA system is ready!")
# print("Type 'exit' to quit.\n")


# while True:
#    question = input("Ask a question: ")
#    if question.lower() == "exit":
#        break


#    response = rag_chain.invoke({"question": question})
#    docs = retriever.invoke(question)
#    print("\n🔍 Retrieved chunks:")
#    for i, d in enumerate(docs):
#        print(f"\n--- Chunk {i+1} ---")
#        print(d.page_content[:300])   


#    print("\nAnswer:")
#    print(response.content)
#    print("-" * 50)
chat_history = ChatMessageHistory()

def rag_with_memory(input_dict):
   # global last_topic


   question = input_dict["question"]
   history = chat_history.messages


   if len(history) == 0:
       rewritten = question
   else:
       rewritten = rewrite_chain.invoke(
           {"history": history, "question": question}
       ).content


   print("rewritten------> ", rewritten)
   return rewritten, rag_chain.invoke({"question": rewritten})


@app.route("/")
def home():
   return render_template("chatbot.html")


@app.route("/ask", methods=["POST"])
def ask():
   user_message = request.form.get("message") # read message "hi"
   print("user_message ----> ", user_message)


   # 1️⃣ Rewrite & answer (history excludes current question)
   rewritten_question, response = rag_with_memory({"question": user_message})


   chat_history.add_user_message(user_message)
   chat_history.add_ai_message(response.content)


   # docs = retriever.invoke(rewritten_question)
   # print("-" * 50)
   # print("\n🔍 Retrieved chunks:")
   # for i, d in enumerate(docs):
   #     print(f"\n--- Chunk {i+1} ---")
   #     print(d.page_content[:300])


   return jsonify({"reply": response.content})

if __name__ == "__main__":
   app.run(debug=False)