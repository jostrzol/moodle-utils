#build stage
FROM golang:alpine AS builder
RUN apk add --no-cache git
WORKDIR /go/src/server
COPY . .
RUN go get -d -v ./...
RUN go build -o /go/bin/server -v

#final stage
FROM alpine:latest
RUN apk --no-cache add ca-certificates
COPY --from=builder /go/bin/server /server
ENTRYPOINT ./server                     \
    -p=$PORT                            \
    -c=$CERT                            \
    -k=$KEY                             \
    -autosave-interval=$AUTOSAVE        \
    -save-file=$SAVEFILE                \
    -log-file=$LOGFILE                  \
    -console-log-level=$CONSOLE_LOGLVL  \
    -file-log-level=$FILE_LOGLVL        
EXPOSE 8080
