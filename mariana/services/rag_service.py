from langchain_postgres.vectorstores import PGVector
from langchain_nvidia_ai_endpoints import NVIDIAEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.documents import Document
from dotenv import load_dotenv
import os

load_dotenv()

class RagService:
    def __init__(self):
        """Initializes PGVector with Google embeddings for document retrieval."""
        embeddings = NVIDIAEmbeddings(                                        # ← changed
            model="nvidia/llama-3.2-nemoretriever-300m-embed-v1",
            api_key=os.getenv("NVIDIA_API_KEY"), # Would need to remove if env variable is stored in Railway
            truncate="NONE",
        )
        self.vector_store = PGVector(
            embeddings=embeddings,
            collection_name="documents",
            connection=os.getenv("DATABASE_URL"),
        )

        self.retriever = self.vector_store.as_retriever(search_kwargs={"k": 5})

    def ingest(self, text: str, metadata: dict) -> None:
        splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=50)
        chunks = splitter.create_documents([text], metadatas=[metadata])
        self.vector_store.add_documents(chunks)

    def retrieve(self, query: str) -> list[Document]:
        """Retrieves top 5 document chunks from PGVector for a general query."""
        result = self.retriever.invoke(query)
        return result
    
    def retrieve_by_ids(self, query: str, document_ids: list[str]) -> list[Document]:
        """Retrieves top 5 document chunks filtered by specific document IDs."""
        retriever = self.vector_store.as_retriever(
            search_kwargs={
                "k": 5,
                "filter": {"id": {"$in": document_ids}}
            }
        )
        result = retriever.invoke(query)
        return result