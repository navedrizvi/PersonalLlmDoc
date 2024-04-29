FROM ollama/ollama as downloader

ARG MODEL_NAME

COPY startup.sh /startup.sh
RUN chmod +x /startup.sh

RUN /startup.sh $MODEL_NAME

FROM ollama/ollama

COPY --from=downloader /root/.ollama/ /root/.ollama/
COPY --from=downloader /bin/ollama /bin/ollama

ENV HOME=/root
RUN chmod 777 /root

RUN apt-get update && apt-get install -y \
    git \
    git-lfs \
    xz-utils \
    tar \
    python3-pip \
    rsync \
    && rm -rf /var/lib/apt/lists/*

RUN git lfs install

RUN git clone https://github.com/aws/aws-lambda-base-images.git
WORKDIR ./aws-lambda-base-images/
RUN git checkout python3.12

WORKDIR ./x86_64/

RUN mkdir -p ./unzipped
RUN for file in *.xz; do \
    [ -e "$file" ] && unxz -k "$file" && mv "${file%.*}" unzipped/ || echo "No .xz files found or error extracting $file"; \
    done \
    && for file in ./unzipped/*.tar; do \
    [ -e "$file" ] && tar -xvf "$file" -C unzipped/ || echo "No .tar files found or error extracting $file"; \
    done \
    && rm -rf ./unzipped/*.tar
WORKDIR ./unzipped/

RUN cp -r ./usr/local/bin/ /usr/local/bin/
RUN cp -r ./var/lang/ /var/lang/
RUN cp -r ./var/runtime/ /var/runtime/

RUN mkdir /var/task/
RUN cp ./lambda-entrypoint.sh /var/task/lambda-entrypoint.sh

ENV LANG=en_US.UTF-8
ENV TZ=:/etc/localtime
ENV PATH=/var/lang/bin:/usr/local/bin:/usr/bin/:/bin:/opt/bin:$PATH
ENV LD_LIBRARY_PATH=/var/lang/lib:/lib64:/usr/lib64:/var/runtime:/var/runtime/lib:/var/task:/var/task/lib:/opt/lib
ENV LAMBDA_TASK_ROOT=/var/task
ENV LAMBDA_RUNTIME_DIR=/var/runtime
WORKDIR /var/task/
ENTRYPOINT ["./lambda-entrypoint.sh"]

COPY ./function.py .

RUN pip3 install requests

CMD ["function.lambda_handler"]
