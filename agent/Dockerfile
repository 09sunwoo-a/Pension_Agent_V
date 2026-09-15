FROM cmheastggenaiacr01.azurecr.io/python:3.10

ARG ENV_FILE_PATH
ENV ENV_PATH=$ENV_FILE_PATH

WORKDIR /custom

COPY ./requirements.txt /custom/requirements.txt

RUN pip install --no-cache-dir \
    --index-url https://stg-nexus-genaihub.kbonecloud.com/repository/pypi/simple \
    --trusted-host stg-nexus-genaihub.kbonecloud.com \
    -r /custom/requirements.txt

COPY ./.env /custom/.env
COPY ./main.py /custom/main.py
COPY ./llm_client.py /custom/llm_client.py

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
