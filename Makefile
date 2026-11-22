.PHONY: install test lint build run docker-build clean

install:
	npm ci

test:
	npm test

lint:
	npm run lint

build:
	npm run build

run:
	npx serve -l 3000 .

docker-build:
	docker build -t gold-arbitrage-analyzer:latest .

clean:
	rm -rf .vercel/output coverage
