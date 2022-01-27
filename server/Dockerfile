FROM golang:1.16.2 AS builder

WORKDIR /go/src/moodle-utils
COPY . .
RUN GOOS=linux GOARCH=amd64 CGO_ENABLED=0 go build

FROM alpine:3.13.3
RUN apk add --no-cache ca-certificates
RUN addgroup -S moodle-utils && adduser -S moodle-utils -G moodle-utils
WORKDIR /etc/moodle-utils/
COPY --from=builder /go/src/moodle-utils/server /etc/moodle-utils/
RUN chown moodle-utils:moodle-utils /etc/moodle-utils/
USER moodle-utils

EXPOSE 8080
ENTRYPOINT ./server -p 8080 -autosave-interval=30s -save-file=server-save.json -log-file=server-log.json -console-log-level=warn -file-log-level=info