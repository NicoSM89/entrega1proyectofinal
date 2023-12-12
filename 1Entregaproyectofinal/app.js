const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = 8080;

app.use(express.json());

// Rutas para productos
const productsRouter = express.Router();

const productsFilePath = path.join(__dirname, 'productos.json');

const readProductsFile = async () => {
  try {
    const data = await fs.readFile(productsFilePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
};

const writeProductsFile = async (data) => {
  await fs.writeFile(productsFilePath, JSON.stringify(data, null, 2), 'utf-8');
};

productsRouter.get('/', async (req, res) => {
  // Lógica para obtener todos los productos
  const products = await readProductsFile();
  res.json(products);
});

productsRouter.get('/:pid', async (req, res) => {
  // Obtener un producto por ID
  const products = await readProductsFile();
  const product = products.find((p) => p.id === req.params.pid);
  if (!product) {
    return res.status(404).json({ error: 'Producto no encontrado' });
  }
  res.json(product);
});

productsRouter.post('/', async (req, res) => {
  // Agregar un nuevo producto
  const { title, description, code, price, available, stock, category, thumbnails } = req.body;

  if (!title || !description || !code || !price || available === undefined || !stock || !category) {
    return res.status(400).json({ error: 'Todos los campos son obligatorios, excepto thumbnails' });
  }

  const newProduct = {
    id: uuidv4(),
    title,
    description,
    code,
    price,
    available,
    stock,
    category,
    thumbnails: thumbnails || [],
    status: true,
  };

  const products = await readProductsFile();
  products.push(newProduct);

  await writeProductsFile(products);

  res.status(201).json(newProduct);
});

productsRouter.put('/:pid', async (req, res) => {
  // Actualizar un producto por ID
  const { title, description, code, price, available, stock, category, thumbnails } = req.body;

  const products = await readProductsFile();
  const index = products.findIndex((p) => p.id === req.params.pid);

  if (index === -1) {
    return res.status(404).json({ error: 'Producto no encontrado' });
  }

  const updatedProduct = {
    id: req.params.pid,
    title: title || products[index].title,
    description: description || products[index].description,
    code: code || products[index].code,
    price: price || products[index].price,
    available: available !== undefined ? available : products[index].available,
    stock: stock || products[index].stock,
    category: category || products[index].category,
    thumbnails: thumbnails || products[index].thumbnails,
    status: products[index].status,
  };

  products[index] = updatedProduct;
  await writeProductsFile(products);

  res.json(updatedProduct);
});

productsRouter.delete('/:pid', async (req, res) => {
  // Eliminar un producto por ID
  const products = await readProductsFile();
  const filteredProducts = products.filter((p) => p.id !== req.params.pid);

  if (filteredProducts.length === products.length) {
    return res.status(404).json({ error: 'Producto no encontrado' });
  }

  await writeProductsFile(filteredProducts);

  res.json({ success: true });
});

// Rutas para carritos
const cartsRouter = express.Router();

const cartsFilePath = path.join(__dirname, 'carrito.json');

const readCartsFile = async () => {
  try {
    const data = await fs.readFile(cartsFilePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
};

const writeCartsFile = async (data) => {
  await fs.writeFile(cartsFilePath, JSON.stringify(data, null, 2), 'utf-8');
};

cartsRouter.post('/', async (req, res) => {
  // Crear un nuevo carrito
  const newCart = {
    id: uuidv4(),
    products: [],
  };

  const carts = await readCartsFile();
  carts.push(newCart);

  await writeCartsFile(carts);

  res.status(201).json(newCart);
});

cartsRouter.get('/:cid', async (req, res) => {
  // Listar productos del carrito por ID
  const carts = await readCartsFile();
  const cart = carts.find((c) => c.id === req.params.cid);

  if (!cart) {
    return res.status(404).json({ error: 'Carrito no encontrado' });
  }

  res.json(cart.products);
});

cartsRouter.post('/:cid/product/:pid', async (req, res) => {
  // Agregar producto al carrito
  const { quantity } = req.body;

  if (!quantity || quantity <= 0) {
    return res.status(400).json({ error: 'La cantidad debe ser mayor que cero' });
  }

  const products = await readProductsFile();  // <-- Aquí usabas readProductsFile en lugar de readCartsFile
  const carts = await readCartsFile();  // <-- Corregido

  const product = products.find((p) => p.id === req.params.pid);

  if (!product) {
    return res.status(404).json({ error: 'Producto no encontrado' });
  }

  const cart = carts.find((c) => c.id === req.params.cid);

  if (!cart) {
    return res.status(404).json({ error: 'Carrito no encontrado' });
  }

  const existingProduct = cart.products.find((p) => p.product === req.params.pid);

  if (existingProduct) {
    existingProduct.quantity += quantity;
  } else {
    cart.products.push({
      product: req.params.pid,
      quantity,
    });
  }

  await writeCartsFile(carts);

  res.json(cart);
});


app.use('/api/products', productsRouter);
app.use('/api/carts', cartsRouter);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
