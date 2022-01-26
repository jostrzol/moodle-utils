FROM golang:1.16.2 AS builder

WORKDIR /go/src/moodle-utils
COPY . .
RUN GOOS=linux GOARCH=amd64 CGO_ENABLED=0 go build

FROM alpine:3.13.3
RUN apk add --no-cache ca-certificates
RUN addgroup -S moodle-utils && adduser -S moodle-utils -G moodle-utils
WORKDIR /etc/moodle-utils/
COPY --from=builder /go/src/moodle-utils/moodle-utils /etc/moodle-utils/
RUN chown moodle-utils:moodle-utils /etc/moodle-utils/
USER moodle-utils
ENTRYPOINT ./moodle-utils -p 8080