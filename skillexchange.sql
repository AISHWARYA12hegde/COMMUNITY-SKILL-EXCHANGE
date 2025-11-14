CREATE DATABASE  IF NOT EXISTS skillexchange;
USE skillexchange;
ALTER TABLE skills 
ADD COLUMN user_id INT,
ADD CONSTRAINT fk_user_skill FOREIGN KEY (user_id) REFERENCES users(user_id);


