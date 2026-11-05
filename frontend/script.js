const API_URL = "http://localhost:8081/api/expenses";

const form = document.getElementById("expenseForm");
const expenseId = document.getElementById("expenseId");
const titleInput = document.getElementById("titleInput");
const amountInput = document.getElementById("amountInput");
const categoryInput = document.getElementById("categoryInput");
const submitButton = document.getElementById("submitButton");
const cancelButton = document.getElementById("cancelButton");
const formTitle = document.getElementById("formTitle");
const expensesList = document.getElementById("expensesList");
const emptyState = document.getElementById("emptyState");
const totalAmount = document.getElementById("totalAmount");
const expenseCount = document.getElementById("expenseCount");
const categoryCount = document.getElementById("categoryCount");
const searchInput = document.getElementById("searchInput");
const filterInput = document.getElementById("filterInput");
const refreshButton = document.getElementById("refreshButton");
const toast = document.getElementById("toast");

let expenses = [];

async function loadExpenses() {
    try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error("Could not load expenses");
        expenses = await response.json();
        updateDashboard();
        updateCategoryFilter();
        renderExpenses();
    } catch (error) {
        showToast("Could not connect to the backend.", true);
        console.error(error);
    }
}

async function saveExpense(data) {
    const id = expenseId.value;
    const url = id ? `${API_URL}/${id}` : API_URL;
    const method = id ? "PUT" : "POST";

    const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    });

    if (!response.ok) throw new Error("Could not save expense");
}

form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const data = {
        title: titleInput.value.trim(),
        amount: Number(amountInput.value),
        category: categoryInput.value
    };

    if (!data.title || !data.amount || !data.category) return;

    try {
        const editing = Boolean(expenseId.value);
        await saveExpense(data);
        resetForm();
        await loadExpenses();
        showToast(editing ? "Expense updated." : "Expense added.");
    } catch (error) {
        showToast("Something went wrong.", true);
        console.error(error);
    }
});

async function deleteExpense(id) {
    if (!confirm("Delete this expense?")) return;

    try {
        const response = await fetch(`${API_URL}/${id}`, { method: "DELETE" });
        if (!response.ok) throw new Error("Could not delete expense");
        await loadExpenses();
        showToast("Expense deleted.");
    } catch (error) {
        showToast("Could not delete expense.", true);
        console.error(error);
    }
}

function startEdit(id) {
    const expense = expenses.find(item => item.id === id);
    if (!expense) return;

    expenseId.value = expense.id;
    titleInput.value = expense.title;
    amountInput.value = expense.amount;
    categoryInput.value = expense.category;
    formTitle.textContent = "Edit an expense";
    submitButton.textContent = "Save Changes";
    cancelButton.classList.remove("hidden");
    titleInput.focus();
}

function resetForm() {
    form.reset();
    expenseId.value = "";
    formTitle.textContent = "Add an expense";
    submitButton.textContent = "Add Expense";
    cancelButton.classList.add("hidden");
}

function updateDashboard() {
    const total = expenses.reduce((sum, expense) => sum + Number(expense.amount), 0);
    const categories = new Set(expenses.map(expense => expense.category));

    totalAmount.textContent = `$${total.toFixed(2)}`;
    expenseCount.textContent = expenses.length;
    categoryCount.textContent = categories.size;
}

function updateCategoryFilter() {
    const current = filterInput.value;
    const categories = [...new Set(expenses.map(expense => expense.category))].sort();

    filterInput.innerHTML = '<option value="all">All categories</option>';
    categories.forEach(category => {
        const option = document.createElement("option");
        option.value = category;
        option.textContent = category;
        filterInput.appendChild(option);
    });

    if (categories.includes(current)) filterInput.value = current;
}

function renderExpenses() {
    const search = searchInput.value.trim().toLowerCase();
    const category = filterInput.value;

    const filtered = expenses.filter(expense => {
        const matchesSearch = expense.title.toLowerCase().includes(search);
        const matchesCategory = category === "all" || expense.category === category;
        return matchesSearch && matchesCategory;
    });

    expensesList.innerHTML = "";
    emptyState.classList.toggle("hidden", filtered.length !== 0);

    filtered
        .slice()
        .reverse()
        .forEach(expense => {
            const card = document.createElement("article");
            card.className = "expense-card";
            card.innerHTML = `
                <div class="expense-main">
                    <h4>${escapeHtml(expense.title)}</h4>
                    <p>Expense #${expense.id}</p>
                </div>
                <span class="category-badge">${escapeHtml(expense.category)}</span>
                <strong class="expense-amount">$${Number(expense.amount).toFixed(2)}</strong>
                <div class="card-actions">
                    <button class="icon-btn" title="Edit" onclick="startEdit(${expense.id})">✎</button>
                    <button class="icon-btn delete-btn" title="Delete" onclick="deleteExpense(${expense.id})">×</button>
                </div>
            `;
            expensesList.appendChild(card);
        });
}

function escapeHtml(value) {
    const div = document.createElement("div");
    div.textContent = value;
    return div.innerHTML;
}

function showToast(message, isError = false) {
    toast.textContent = message;
    toast.classList.toggle("error", isError);
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 2400);
}

searchInput.addEventListener("input", renderExpenses);
filterInput.addEventListener("change", renderExpenses);
refreshButton.addEventListener("click", loadExpenses);
cancelButton.addEventListener("click", resetForm);

loadExpenses();
