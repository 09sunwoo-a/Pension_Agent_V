# Deploy only this directory. Google/validation code and secrets are excluded.
FROM cmheastggenaiacr01.azurecr.io/python:3.10
ARG ENV_FILE_PATH
ENV ENV_PATH=$ENV_FILE_PATH
WORKDIR /custom
COPY ./requirements.txt /custom/requirements.txt
RUN pip install --no-cache-dir \
    --index-url https://stg-nexus-genaihub.kbonecloud.com/repository/pypi/simple \
    --trusted-host stg-nexus-genaihub.kbonecloud.com \
    -r /custom/requirements.txt
COPY ./branch_models.py /custom/branch_models.py
COPY ./branch_data.json /custom/branch_data.json
COPY ./branch_data.py /custom/branch_data.py
COPY ./branch_query.py /custom/branch_query.py
COPY ./branch_language.py /custom/branch_language.py
COPY ./branch_service.py /custom/branch_service.py
COPY ./llm_client.py /custom/llm_client.py
COPY ./main.py /custom/main.py
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
