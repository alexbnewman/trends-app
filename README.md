# Project Setup Guide

## Start Frontend Dev Server
Run the following command to start the frontend development server:
```bash
npm run dev
```
## Start Backend
Run the backend server with:

```bash
python3 app.py
```
## Initialize Database
Set up and apply database migrations:

```bash
flask db init
flask db migrate
flask db upgrade
```

## Train the machine learning models with:

```bash
flask train-models
```
