# Spaced Repetition App

## Description

Spaced Repetition is an app that allows users to learn the Spanish language using a technique called "spaced repetition". The intent is to help users learn Spanish words by revealing newer and difficult words more frequently and older and easier words less frequently.

## Link to Live App & Repos

- Live App:
  - https://spaced-repetition-zeta-flax.vercel.app/
- Server Repo:
  - https://github.com/roxanne-m/spaced-repetition-server.git
- Client Repo:
  - https://github.com/roxanne-m/spaced-repetition-client.git

## Application Features

- User can register using their name, a username, and a password. The password must be 8 characters long, must contain one upper case, lower case, number, and special character.

![register](https://user-images.githubusercontent.com/70825798/110029429-4f06c500-7ce9-11eb-9d7b-4127334d99f5.JPG)

- As a returning user, the user may login using their username and password.

![login](https://user-images.githubusercontent.com/70825798/110029477-5d54e100-7ce9-11eb-8d45-23fb016e2306.JPG)

- Once logged in, the user will view their dashboard that provides the following information: Language, a list of words to practice, the total amount of correct and incorrect times the user has answered for a specified word, and their total amount of correct answers.

![dashboard](https://user-images.githubusercontent.com/70825798/110029704-a3aa4000-7ce9-11eb-9408-75a3d745be42.JPG)

- When beginning their practice, the user will be prompted to a screen that displays a word to be translated, their total score, and their total tally for correct and incorrect answers for the given word. After answering, the user will be prompted to a results page that will inform them whether or not their answer was correct.

![attempt](https://user-images.githubusercontent.com/70825798/110029943-f1bf4380-7ce9-11eb-81e8-d5075dc570c2.JPG)

## Tech Stacks Used

- Front-end technologies
  - Javascript frameworks
  - CSS grid
  - React
  - Deployed via Vercel
- Back-end technologies
  - Node.js
  - RESTful Api
  - Deployed via Heroku
- Data Persistence
  - PostgreSQL

## Local dev setup

If using user `dunder_mifflin`:

```bash
mv example.env .env
createdb -U dunder_mifflin spaced-repetition
createdb -U dunder_mifflin spaced-repetition-test
```

If your `dunder_mifflin` user has a password be sure to set it in `.env` for all appropriate fields. Or if using a different user, update appropriately.

```bash
npm install
npm run migrate
env MIGRATION_DB_NAME=spaced-repetition-test npm run migrate
```

And `npm test` should work at this point

## Configuring Postgres

For tests involving time to run properly, configure your Postgres database to run in the UTC timezone.

1. Locate the `postgresql.conf` file for your Postgres installation.
   1. E.g. for an OS X, Homebrew install: `/usr/local/var/postgres/postgresql.conf`
   2. E.g. on Windows, _maybe_: `C:\Program Files\PostgreSQL\11.2\data\postgresql.conf`
   3. E.g on Ubuntu 18.04 probably: '/etc/postgresql/10/main/postgresql.conf'
2. Find the `timezone` line and set it to `UTC`:

```conf
# - Locale and Formatting -

datestyle = 'iso, mdy'
#intervalstyle = 'postgres'
timezone = 'UTC'
#timezone_abbreviations = 'Default'     # Select the set of available time zone
```

## Scripts

Start the application `npm start`

Start nodemon for the application `npm run dev`

Run the tests mode `npm test`

Run the migrations up `npm run migrate`

Run the migrations down `npm run migrate -- 0`
