import uvicorn

if __name__ == "__main__":
    print("Launching AI Career Recommendation System Backend...")
    print("API documentation will be available at http://127.0.0.1:8000/docs")
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)
