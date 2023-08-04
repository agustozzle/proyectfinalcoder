let days = 0;
let dailyExpenses = [];
let selectedCategory = 'otros';
let initialMoney = 0;

function showExpenseAlert(day) {
  return new Promise((resolve, reject) => {
    const swalWithArrow = Swal.mixin({
      customClass: {
        confirmButton: 'category-arrow',
      },
      buttonsStyling: false,
      focusConfirm: false,
      preConfirm: () => {
        const expense = parseFloat(document.getElementById('expenseInput').value);

        if (isNaN(expense)) {
          Swal.showValidationMessage('Ingrese un monto válido');
        } else if (expense > initialMoney) {
          Swal.showValidationMessage('El gasto no puede superar el dinero inicial');
        } else {
          return { expense, category: selectedCategory };
        }
      },
    });

    swalWithArrow.fire({
      title: `Gastos del día ${day}`,
      html: `
        <input type="number" id="expenseInput" step="0.01" placeholder="Ingrese sus gastos">
        <div class="category-arrow" id="categoryArrow${day}">
          <i class="fas fa-chevron-down"></i> Categoría
        </div>
        <div class="category-list" id="categoryList${day}"></div>
      `,
    }).then((result) => {
      if (result.isConfirmed) {
        resolve(result.value);
      } else {
        reject("Ingrese un monto válido");
      }
    });

    const categoryArrow = document.getElementById(`categoryArrow${day}`);
    const categoryList = document.getElementById(`categoryList${day}`);

    categoryArrow.addEventListener('click', () => {
      categoryList.classList.toggle('active');
    });

    categoryList.innerHTML = '';

    const categories = ['comida', 'transporte', 'entretenimiento', 'educacion', 'otros'];

    categories.forEach((category) => {
      const categoryItem = document.createElement('p');
      categoryItem.textContent = category;
      categoryItem.addEventListener('click', () => {
        selectedCategory = category;
        categoryArrow.innerHTML = `<i class="fas fa-chevron-down"></i> ${category}`;
        categoryList.classList.remove('active');
      });
      categoryList.appendChild(categoryItem);
    });
  });
}

function showDailySummary(day) {
  const dayExpense = dailyExpenses.find((expense) => expense.day === day);
  if (dayExpense) {
    const { expense, category } = dayExpense;
    Swal.fire({
      title: `Resumen del día ${day}`,
      html: `<p>Gasto del día ${day}: $${expense.toFixed(2)}</p><p>Categoría: ${category}</p>`,
      icon: 'info',
    });
  } else {
    Swal.fire('Error', 'No se encontró información para este día', 'error');
  }
}

function showNegativeBalanceAlert() {
  Swal.fire({
    title: 'Saldo Negativo',
    text: 'Su saldo ha quedado en negativo. ¡Cuidado con los gastos!',
    icon: 'warning',
  });
}

function showCongratulationsAlert(totalExpenses) {
  const savings = initialMoney - totalExpenses;
  if (savings >= 0) {
    Swal.fire({
      title: '¡Felicidades!',
      html: `<p>Ha logrado ahorrar: $${savings.toFixed(2)}</p>`,
      icon: 'success',
    });
  }
}

function showSummary(totalExpenses) {
  const totalSavings = initialMoney - totalExpenses;

  let summaryText = `<p>Saldo Inicial: $${initialMoney.toFixed(2)}</p>`;
  dailyExpenses.slice(1).forEach((expense) => {
    summaryText += `<p>Día ${expense.day}: $${expense.expense.toFixed(2)} (${expense.category}) <a href="#" class="view-summary" data-day="${expense.day}">Ver Detalles</a></p>`;
  });

  summaryText += `<p>Ahorro Total: $${totalSavings.toFixed(2)}</p>`;

  Swal.fire({
    title: 'Resumen de Gastos',
    html: summaryText,
    icon: 'info',
  }).then((result) => {
    if (result.isConfirmed) {
      const viewSummaryLinks = document.getElementsByClassName('view-summary');
      Array.from(viewSummaryLinks).forEach((link) => {
        link.addEventListener('click', (event) => {
          event.preventDefault();
          const day = event.target.getAttribute('data-day');
          showDailySummary(parseInt(day));
        });
      });
    }
  });
}

async function trackDailyExpense(day) {
  try {
    const expenseData = await showExpenseAlert(day);
    dailyExpenses.push({ day, ...expenseData });
    localStorage.setItem('dailyExpenses', JSON.stringify(dailyExpenses)); // Almacenar en Local Storage
  } catch (error) {
    Swal.fire('Error', error, 'error');
  }
}

async function trackExpenses() {
  const totalDays = parseInt(document.getElementById('totalDays').value);

  if (isNaN(totalDays) || totalDays <= 0) {
    Swal.fire('Error', 'Ingrese un número de días válido', 'error');
    return;
  }

  days = totalDays;
  dailyExpenses = [];

  for (let i = 1; i <= days; i++) {
    await trackDailyExpense(i);
  }

  const totalExpenses = dailyExpenses.reduce((total, item) => total + item.expense, 0);
  showSummary(totalExpenses);
  showCongratulationsAlert(totalExpenses);
  if (totalExpenses > initialMoney) {
    showNegativeBalanceAlert();
  }

  // Almacenar los datos en el Local Storage
  localStorage.setItem('initialMoney', initialMoney);
  localStorage.setItem('totalDays', totalDays);
}

function updateFormFields() {
  document.getElementById('initialMoney').value = initialMoney;
  document.getElementById('totalDays').value = days;
}

function loadStoredData() {
  const storedInitialMoney = localStorage.getItem('initialMoney');
  const storedTotalDays = localStorage.getItem('totalDays');
  const storedDailyExpenses = localStorage.getItem('dailyExpenses');

  if (storedInitialMoney && storedTotalDays && storedDailyExpenses) {
    dailyExpenses = JSON.parse(storedDailyExpenses);
    initialMoney = parseFloat(storedInitialMoney);
    days = parseInt(storedTotalDays);
    updateFormFields();
  }
}

function actualizarCards() {
  const cardsContainer = document.getElementById('dayCards');
  cardsContainer.innerHTML = '';

  // Cargar datos almacenados del Local Storage
  const storedDailyExpenses = localStorage.getItem('dailyExpenses');
  if (storedDailyExpenses) {
    dailyExpenses = JSON.parse(storedDailyExpenses);
  }

  // Mostrar cards de cada día completado
  dailyExpenses.forEach((expense) => {
    const card = document.createElement('div');
    card.classList.add('day-card');
    card.innerHTML = `
      <h3>Día ${expense.day}</h3>
      <p>Gasto: $${expense.expense.toFixed(2)}</p>
      <p>Categoría: ${expense.category}</p>
    `;
    cardsContainer.appendChild(card);
  });
}

// Cargar datos almacenados al cargar la página
loadStoredData();
actualizarCards();

document.getElementById('startTracking').addEventListener('click', () => {
  initialMoney = parseFloat(document.getElementById('initialMoney').value);
  trackExpenses();
});

