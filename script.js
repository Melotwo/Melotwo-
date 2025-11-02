/**
 * The Generics Store Cart Logic (script.js)
 * Handles all dynamic functionality for the e-commerce cart:
 * adding items, removing items, quantity changes, and updating the total.
 */

// Global state to ensure the script runs after the DOM is fully loaded.
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', ready)
} else {
    ready()
}

// Helper function to find the cart-items container easily
function getCartItemsContainer() {
    return document.getElementsByClassName('cart-items')[0];
}

function ready() {
    // 1. Setup listeners for 'REMOVE' buttons
    const removeCartItemButtons = document.getElementsByClassName('btn-danger');
    for (let i = 0; i < removeCartItemButtons.length; i++) {
        const button = removeCartItemButtons[i];
        button.addEventListener('click', removeCartItem);
    }

    // 2. Setup listeners for quantity changes
    const quantityInputs = document.getElementsByClassName('cart-quantity-input');
    for (let i = 0; i < quantityInputs.length; i++) {
        const input = quantityInputs[i];
        input.addEventListener('change', quantityChanged);
    }

    // 3. Setup listeners for 'ADD TO CART' buttons
    const addToCartButtons = document.getElementsByClassName('shop-item-button');
    for (let i = 0; i < addToCartButtons.length; i++) {
        const button = addToCartButtons[i];
        button.addEventListener('click', addToCartClicked);
    }

    // 4. Setup listener for 'PURCHASE' button
    document.getElementsByClassName('btn-purchase')[0].addEventListener('click', purchaseClicked);

    // Initial update to calculate the total for the items already in the HTML
    updateCartTotal();
}

/**
 * Handles the click event for the Purchase button.
 */
function purchaseClicked() {
    const totalElement = document.getElementsByClassName('cart-total-price')[0];
    const total = totalElement.innerText;
    
    // Use a custom message box instead of alert()
    const message = `Thank you for your purchase! Your total is ${total}.`;
    showCustomMessage(message, "Purchase Complete");

    // Clear the cart after purchase
    const cartItems = getCartItemsContainer();
    while (cartItems.hasChildNodes()) {
        cartItems.removeChild(cartItems.firstChild);
    }
    updateCartTotal();
}

/**
 * Creates and displays a custom modal message box.
 * @param {string} message The main text content of the message.
 * @param {string} title The title of the message box.
 */
function showCustomMessage(message, title = "Message") {
    // 1. Create Modal Backdrop
    const backdrop = document.createElement('div');
    backdrop.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
        background-color: rgba(0, 0, 0, 0.6); z-index: 1000;
        display: flex; justify-content: center; align-items: center;
        backdrop-filter: blur(2px);
    `;
    backdrop.id = 'custom-message-modal';

    // 2. Create Modal Content Box
    const box = document.createElement('div');
    box.style.cssText = `
        background-color: #fff; padding: 25px; border-radius: 8px; 
        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3); max-width: 400px; 
        width: 90%; text-align: center;
    `;

    // 3. Create Title
    const titleEl = document.createElement('h3');
    titleEl.innerText = title;
    titleEl.style.cssText = 'color: #333; margin-bottom: 15px; border-bottom: 1px solid #ccc; padding-bottom: 10px;';

    // 4. Create Message
    const messageEl = document.createElement('p');
    messageEl.innerText = message;
    messageEl.style.cssText = 'color: #555; margin-bottom: 20px; line-height: 1.4;';

    // 5. Create Close Button
    const closeBtn = document.createElement('button');
    closeBtn.innerText = 'OK';
    closeBtn.style.cssText = `
        padding: 10px 20px; background-color: #007bff; color: white; 
        border: none; border-radius: 5px; cursor: pointer; font-weight: bold;
        transition: background-color 0.2s;
    `;
    closeBtn.onmouseover = () => closeBtn.style.backgroundColor = '#0056b3';
    closeBtn.onmouseout = () => closeBtn.style.backgroundColor = '#007bff';

    // 6. Append elements and close logic
    box.appendChild(titleEl);
    box.appendChild(messageEl);
    box.appendChild(closeBtn);
    backdrop.appendChild(box);
    document.body.appendChild(backdrop);

    // Click event to remove the modal
    closeBtn.addEventListener('click', () => {
        document.body.removeChild(backdrop);
    });
}


/**
 * Handles the click event for the Remove button.
 * @param {Event} event The click event object.
 */
function removeCartItem(event) {
    const buttonClicked = event.target;
    // Remove the entire cart-row (parent of the parent of the button)
    buttonClicked.parentElement.parentElement.remove();
    updateCartTotal();
}

/**
 * Handles the change event for the Quantity input.
 * @param {Event} event The change event object.
 */
function quantityChanged(event) {
    const input = event.target;
    // Ensure the quantity is a valid number >= 1
    if (isNaN(input.value) || input.value <= 0) {
        input.value = 1;
    }
    updateCartTotal();
}

/**
 * Handles the click event for the Add To Cart button.
 * Gets item details and calls addItemToCart.
 * @param {Event} event The click event object.
 */
function addToCartClicked(event) {
    const button = event.target;
    const shopItem = button.parentElement.parentElement;
    
    // Get item details
    const title = shopItem.getElementsByClassName('shop-item-title')[0].innerText;
    const priceText = shopItem.getElementsByClassName('shop-item-price')[0].innerText;
    const imageSrc = shopItem.getElementsByClassName('shop-item-image')[0].src;

    // Convert price text to a numeric value for easier comparison
    const price = parseFloat(priceText.replace('$', '').trim()); 

    addItemToCart(title, price, imageSrc);
    updateCartTotal();
}

/**
 * Adds a new item row to the cart if it's not already present.
 * If the item is present, it increments the quantity.
 * @param {string} title The title of the item.
 * @param {number} price The price of the item (as a number).
 * @param {string} imageSrc The image source URL.
 */
function addItemToCart(title, price, imageSrc) {
    const cartItems = getCartItemsContainer();
    const cartItemNames = cartItems.getElementsByClassName('cart-item-title');

    // Check if item is already in cart
    for (let i = 0; i < cartItemNames.length; i++) {
        if (cartItemNames[i].innerText === title) {
            // If item exists, find its quantity input and increment it
            const quantityInput = cartItemNames[i].closest('.cart-row').getElementsByClassName('cart-quantity-input')[0];
            quantityInput.value = parseInt(quantityInput.value) + 1;
            showCustomMessage(`Increased quantity of ${title} to ${quantityInput.value}.`, "Item Added");
            return;
        }
    }

    // If item is new, create a new cart row
    const cartRow = document.createElement('div');
    cartRow.classList.add('cart-row');

    // Create the structure for the new cart item
    const cartRowContents = `
        <div class="cart-item cart-column">
            <img class="cart-item-image" src="${imageSrc}" width="100" height="100" alt="${title}">
            <span class="cart-item-title">${title}</span>
        </div>
        <span class="cart-price cart-column">$${price.toFixed(2)}</span>
        <div class="cart-quantity cart-column">
            <input class="cart-quantity-input" type="number" value="1">
            <button class="btn btn-danger" type="button">REMOVE</button>
        </div>
    `;
    cartRow.innerHTML = cartRowContents;
    cartItems.append(cartRow);

    // Re-attach listeners to the new elements
    cartRow.getElementsByClassName('btn-danger')[0].addEventListener('click', removeCartItem);
    cartRow.getElementsByClassName('cart-quantity-input')[0].addEventListener('change', quantityChanged);
    
    showCustomMessage(`${title} has been added to your cart.`, "Item Added");
}

/**
 * Calculates and updates the total price of all items in the cart.
 */
function updateCartTotal() {
    const cartItemContainer = getCartItemsContainer();
    const cartRows = cartItemContainer.getElementsByClassName('cart-row');
    let total = 0;

    for (let i = 0; i < cartRows.length; i++) {
        const cartRow = cartRows[i];
        const priceElement = cartRow.getElementsByClassName('cart-price')[0];
        const quantityElement = cartRow.getElementsByClassName('cart-quantity-input')[0];
        
        // Remove '$' and convert to float
        const priceText = priceElement.innerText.replace('$', '').trim();
        const price = parseFloat(priceText); 
        
        // Get quantity value
        const quantity = quantityElement.value;
        
        total += (price * quantity);
    }

    // Round the total to two decimal places
    total = Math.round(total * 100) / 100;

    // Update the displayed total price
    document.getElementsByClassName('cart-total-price')[0].innerText = '$' + total.toFixed(2);
}
