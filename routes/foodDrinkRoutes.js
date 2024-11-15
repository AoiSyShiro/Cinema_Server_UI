const express = require('express');
const router = express.Router();
const foodDrinkController = require('../controllers/foodDrinkController'); 
const multer = require('multer'); 

const storage = multer.memoryStorage(); 
const upload = multer({ storage: storage });

// Lấy danh sách đồ ăn/đồ uống
router.get('/', foodDrinkController.getFoodDrinks);

// Thêm đồ ăn/đồ uống
router.post('/add', upload.single('file'), foodDrinkController.addFoodDrink);

// Cập nhật đồ ăn/đồ uống
router.put('/:id', upload.single('file'), foodDrinkController.updateFoodDrink);

// Xóa đồ ăn/đồ uống
router.delete('/:id', foodDrinkController.deleteFoodDrink);



module.exports = router;
