CREATE TABLE mybooknotes (
    id SERIAL PRIMARY,
    cover_id INT NOT NULL,
    cover_title TEXT NOT NULL,
    cover_img TEXT NOT NULL,
    authur_name TEXT NOT NULL,
    book_preview TEXT NOT NULL,
    book_notes TEXT NOT NULL,
    read_date DATE DEFAULT CURRENT_DATE,
    read_rating INT
);