const mongoose = require("mongoose");
const Movie = require("../models/Movie"); // Mô hình phim

const getMovieDetails = async (req, res) => {
    console.log("Received request for movie_id:", req.params.movie_id); // Ghi log movie_id
    try {
        const movie_id = Number(req.params.movie_id);

        if (isNaN(movie_id) || movie_id <= 0) {
            return res.status(400).json({ message: "ID phim không hợp lệ" });
        }

        const movie = await Movie.findOne({ movie_id: movie_id });

        if (!movie) {
            return res.status(404).json({ message: "Không tìm thấy phim" });
        }

        res.status(200).json(movie);
    } catch (error) {
        console.error("Lỗi khi lấy thông tin phim:", error); // Ghi log lỗi
        res.status(500).json({ message: "Lỗi khi lấy thông tin phim", error });
    }
};


// Lấy danh sách phim theo thể loại
const getMoviesByGenre = async (req, res) => {
    try {
        const { genre } = req.params;

        // Kiểm tra nếu genre không phải là số hợp lệ
        const category_id = Number(genre);
        if (isNaN(category_id) || category_id <= 0) {
            return res.status(400).json({ message: "Thể loại không hợp lệ" });
        }

        // Tìm danh sách phim theo category_id
        const movies = await Movie.find({ category_id: category_id });
        if (movies.length === 0) {
            return res.status(404).json({ message: "Không tìm thấy phim cho thể loại này" });
        }

        res.status(200).json(movies);
    } catch (error) {
        res.status(500).json({ message: "Lỗi khi lấy danh sách phim theo thể loại", error });
    }
};

module.exports = { getMovieDetails, getMoviesByGenre };
