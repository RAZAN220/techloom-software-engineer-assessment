import Product from '../models/Product.js';
import { getAllStockLevels } from '../services/inventoryService.js';

export const createProduct = async (req, res) => {
  try {
    const data = { ...req.body };
    if (data.availableStock !== undefined && data.stock === undefined) data.stock = data.availableStock;
    if (!String(data.name || '').trim()) return res.status(422).json({ success: false, message: 'Product name is required', code: 'VALIDATION_ERROR' });
    res.status(201).json(await Product.create(data));
  }
  catch (error) { res.status(400).json({ message: error.message }); }
};

export const getProducts = async (req, res) => {
  try { res.json(await Product.find()); }
  catch (error) { res.status(500).json({ message: error.message }); }
};

export const getProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (error) { res.status(400).json({ message: error.message }); }
};

export const updateProduct = async (req, res) => {
  try {
    const data = { ...req.body };
    if (data.availableStock !== undefined && data.stock === undefined) data.stock = data.availableStock;
    delete data.availableStock;
    const product = await Product.findByIdAndUpdate(req.params.id, data, { new: true, runValidators: true });
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (error) { res.status(400).json({ message: error.message }); }
};

export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json({ message: 'Product deleted' });
  } catch (error) { res.status(400).json({ message: error.message }); }
};

export const getStockLevels = async (req, res) => {
  try { res.json(await getAllStockLevels()); }
  catch (error) { res.status(500).json({ message: error.message }); }
};