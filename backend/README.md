# README

This README would normally document whatever steps are necessary to get the
application up and running.

Things you may want to cover:

* Ruby version

* System dependencies

* Configuration

* Database creation

* Database initialization

* How to run the test suite

* Services (job queues, cache servers, search engines, etc.)

* Deployment instructions

* ...
# Next Step Rails backend

The Rails service is the production-directed API boundary for Next Step. PostgreSQL is configured through Rails' standard database settings and `DATABASE_URL` deployment convention.

Health endpoints:

- `GET /up` confirms that Rails boots.
- `GET /ready` confirms that Rails can verify its PostgreSQL connection. It returns only service status and never application data.

The local development UI may still use the existing loopback service for capabilities that have not yet moved to Rails. Do not treat local SQLite or `/up` alone as PostgreSQL deployment evidence.
