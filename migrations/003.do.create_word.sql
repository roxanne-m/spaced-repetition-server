CREATE TABLE IF NOT EXISTS "word" (
  "id" SERIAL PRIMARY KEY,
  "original" TEXT NOT NULL,
  "translation" TEXT NOT NULL,
  "memory_value" SMALLINT DEFAULT 1,
  "correct_count" SMALLINT DEFAULT 0,
  "incorrect_count" SMALLINT DEFAULT 0,
  "language_id" INTEGER REFERENCES "language"(id)
    ON DELETE CASCADE NOT NULL,
  "next" INTEGER REFERENCES "word"(id)
    ON DELETE SET NULL
);

ALTER TABLE "language"
  ADD COLUMN IF NOT EXISTS "head" INTEGER REFERENCES "word"(id)
    ON DELETE SET NULL;
