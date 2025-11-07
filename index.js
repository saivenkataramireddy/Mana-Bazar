const SUPABASE_URL = 'https://gpyuveeyrckpwokdgzba.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdweXV2ZWV5cmNrcHdva2RnemJhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5MDEzNTIsImV4cCI6MjA3NTQ3NzM1Mn0.mhv2u5uhzqKhgWQqNPysR3Haa5DwL1LtLfeyOvLGPLo';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ---------- LOGIN / REGISTER ----------

function login() {
  document.getElementById("login").style.display = "block";
  document.getElementById("register").style.display = "none";
}

function login_close() {
  document.getElementById("login").style.display = "none";
}

function register() {
  document.getElementById("register").style.display = "block";
  document.getElementById("login").style.display = "none";
}

function register_close() {
  document.getElementById("register").style.display = "none";
}
function seller_register() {
  document.getElementById("seller").style.display = "block";
  document.getElementById("register").style.display = "none";
}

function closeSeller() {
  document.getElementById("seller").style.display = "none";
}


async function registerUser() {
  const email = document.getElementById("reg_email").value;
  const password = document.getElementById("reg_password").value;
  const fullName = document.getElementById("reg_username").value;
  const mobile = document.getElementById("reg_mobile").value;
  const altMobile = document.getElementById("reg_altmobile").value;
  const address = document.getElementById("reg_address").value;

  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { fullName, mobile, altMobile, address, role: "user" },
    },
  });

  if (signUpError) return alert("❌ Registration failed: " + signUpError.message);

  const user = signUpData.user;

  if (user) {
    const { error: dbError } = await supabase.from("users").insert([
      {
        id: user.id,
        email,
        full_name: fullName,
        mobile,
        alt_mobile: altMobile,
        address,
        role: "user",
      },
    ]);

    if (dbError) alert("❌ Failed to save user info: " + dbError.message);
    else {
      alert("✅ Registered successfully! Please verify your email.");
      register_close();
    }
  }
}
async function registerSeller() {
  const name = document.getElementById("seller_name").value;
  const email = document.getElementById("seller_email").value;
  const address = document.getElementById("seller_address").value;
  const adhar = document.getElementById("seller_adhar").value;
  const accountNumber = document.getElementById("seller_account_number").value;
  const password = prompt("Set a password for your seller account:");

  if (!name || !email || !address || !adhar || !accountNumber || !password) {
    alert("⚠️ Please fill all the fields and set a password!");
    return;
  }


  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: name, role: "seller" },
    },
  });

  if (signUpError) {
    alert("❌ Failed to create seller auth account: " + signUpError.message);
    return;
  }

  const user = signUpData.user;

  const { error: dbError } = await supabase.from("users").insert([
    {
      id: user.id, // ✅ use Supabase user ID
      full_name: name,
      email,
      address,
      adhar,
      account_number: accountNumber,
      role: "seller",
    },
  ]);

  if (dbError) {
    alert("❌ Failed to save seller details: " + dbError.message);
  } else {
    alert("✅ Seller registered successfully! Please verify your email.");
    closeSeller();
  }
}
// ---------- FORGOT PASSWORD ----------

function forgotPassword() {
  document.getElementById("forgot").style.display = "block";
  document.getElementById("login").style.display = "none";
}

function closeForgot() {
  document.getElementById("forgot").style.display = "none";
}

async function resetPassword() {
  const email = document.getElementById("forgot_email").value;

  if (!email) {
    alert("⚠️ Please enter your email address.");
    return;
  }

  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: "https://yourdomain.com/reset.html", 
  });

  if (error) {
    alert("❌ Error: " + error.message);
  } else {
    alert("📩 Password reset link sent! Please check your email inbox.");
    closeForgot();
  }
}


async function loginUser() {
  const email = document.getElementById("login_email").value;
  const password = document.getElementById("login_password").value;

  const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (loginError) return alert("❌ Login failed: " + loginError.message);

  const user = loginData.user;

  const { data: userData, error: fetchError } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (fetchError) {
    alert("⚠️ Could not fetch user role. Redirecting to user page...");
    window.location.href = "products.html";
    return;
  }

  const role = userData?.role;

  if (role === "admin") {
    alert("👑 Welcome Admin!");
    window.location.href = "admin.html";
  } else if (role === "seller") {
    alert("🧾 Welcome Seller!");
    window.location.href = "seller.html";
  } else {
    alert("🛍️ Welcome to Mana Bazar!");
    window.location.href = "products.html";
  }
}


async function loadProducts() {
  await loadCategory(null); 
}

async function loadCategory(category = null) {
  const container = document.getElementById("products_container");
  container.innerHTML = "<p style='color:gray;'>Loading products...</p>";

  try {
    
    let query = supabase.from("products").select("*").order("created_at", { ascending: false });

    
    if (category) {
      query = query.ilike("category", category); 
    }

    const { data: products, error } = await query;

    if (error) throw error;

    if (!products.length) {
      container.innerHTML = `<h3 style='color:#999;'>No products found in ${category || "any"} category.</h3>`;
      return;
    }


    container.innerHTML = "";
    products.forEach((product) => {
      const card = document.createElement("div");
      card.className = "product-card";
      card.onclick = () => open_product(product.id);

      card.innerHTML = `
        <img src="${product.image || 'placeholder.jpg'}" alt="${product.name}">
        <h3>${product.name}</h3>
        <p><strong>₹${product.price}</strong></p>
        <p>${product.category}</p>
        <small>${product.description || ""}</small>
      `;
      container.appendChild(card);
    });
  } catch (err) {
    console.error("❌ Supabase Error:", err);
    container.innerHTML = "<p style='color:red;'>Failed to load products.</p>";
  }
}

window.open_product = function (id) {
  window.location.href = `product_open.html?id=${id}`;
};


loadProducts();
window.open_product = function (id) {
  window.location.href = `product_open.html?id=${id}`;
};

loadProducts();





