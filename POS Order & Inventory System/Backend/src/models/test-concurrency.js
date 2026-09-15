/**
 * Concurrency Test - Proves no overselling occurs
 * Run: node test-concurrency.js
 */

const API = 'http://localhost:5000/api';

async function testOverselling() {
  console.log('Starting concurrency test...\n');
  const runId = Date.now();

  // Step 1: Create product with only 10 stock
  const productRes = await fetch(`${API}/products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      name: 'Limited Edition Item', 
      price: 1000, 
      stock: 10 
    })
  });
  const product = await productRes.json();
  console.log(`📦 Product created: ${product.name} (stock: ${product.stock})`);

  // Step 2: Fire 50 concurrent buyers, each wants 1 unit
  console.log('\n🚀 Firing 50 concurrent buyers...\n');
  
  const orders = [];
  for (let buyer = 1; buyer <= 50; buyer += 1) orders.push(await prepareOrder(product._id, buyer, runId));
  const buyAttempts = orders.map((order, index) => checkoutFlow(order, index + 1));

  const results = await Promise.allSettled(buyAttempts);

  // Step 3: Analyze results
  const successes = results.filter(r => r.status === 'fulfilled').length;
  const failures = results.filter(r => r.status === 'rejected').length;

  console.log(`\n📊 Results:`);
  console.log(`   ✅ Successful: ${successes}`);
  console.log(`   ❌ Failed: ${failures}`);
  const sampleFailure = results.find(result => result.status === 'rejected');
  if (sampleFailure) console.log(`   First failure: ${sampleFailure.reason.message}`);

  // Step 4: Verify final stock
  const finalRes = await fetch(`${API}/products/${product._id}`);
  const finalProduct = await finalRes.json();
  
  console.log(`\n📦 Final Stock:`);
  console.log(`   Available: ${finalProduct.stock}`);
  console.log(`   Reserved:  ${finalProduct.reserved}`);
  console.log(`   Total:     ${finalProduct.stock + finalProduct.reserved}`);

  // Assertion
  const totalSold = finalProduct.reserved; // Should equal successes (still reserved)
  const passed = successes === 10 && failures === 40 && finalProduct.stock === 0 && finalProduct.reserved === 10;
  console.log(`${passed ? 'PASS' : 'FAIL'}: expected exactly 10 reservations, 40 rejected requests, and no negative stock`);
  if (!passed) throw new Error('Concurrency assertion failed');
}

async function prepareOrder(productId, buyerNum, runId) {
  // 1. Create cart
  const cartRes = await fetch(`${API}/carts`, { method: 'POST' });
  const cart = await cartRes.json();

  // 2. Add product to cart
  const addRes = await fetch(`${API}/carts/${cart._id}/items`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ productId, quantity: 1 })
  });
  if (!addRes.ok) throw new Error(`Buyer ${buyerNum}: Add to cart failed`);

  // 3. Create order
  const orderRes = await fetch(`${API}/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cartId: cart._id, idempotencyKey: `concurrency-${runId}-${buyerNum}` })
  });
  if (!orderRes.ok) throw new Error(`Buyer ${buyerNum}: Order failed`);
  const order = await orderRes.json();

  return order;
}

async function checkoutFlow(order, buyerNum) {
  const checkoutRes = await fetch(`${API}/orders/${order._id}/checkout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({})
  });
  if (!checkoutRes.ok) {
    const err = await checkoutRes.json();
    throw new Error(`Buyer ${buyerNum}: ${err.message}`);
  }

  return await checkoutRes.json();
}

testOverselling().catch(error => {
  console.error(`Concurrency test could not complete: ${error.message}`);
  process.exitCode = 1;
});