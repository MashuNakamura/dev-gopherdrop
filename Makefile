BINARY_NAME=gopherdrop.exe

NGROK_DOMAIN=washable-collusively-arcelia.ngrok-free.dev

all: build

build:
	go build -o $(BINARY_NAME) .

run: build
	./$(BINARY_NAME)

# Target khusus buat nyalain Tunnel
tunnel:
	ngrok http --domain=$(NGROK_DOMAIN) 8080

clean:
	go clean
	@if exist $(BINARY_NAME) del $(BINARY_NAME)

.PHONY: all build run clean tunnel