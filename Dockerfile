FROM python:3.10-slim-bookworm

WORKDIR /python-docker

COPY requirements.txt requirements.txt
RUN pip3 install -r requirements.txt

COPY . .

EXPOSE 8081

CMD [ "python3", "-m" , "flask", "run", "--host=0.0.0.0", "--port=8081"]