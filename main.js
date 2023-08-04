let days = 0;
let dailyExpenses = [];
let selectedCategory = 'otros';

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
        const initialMoney = dailyExpenses[0];

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

function showNegativeBalanceAlert() {
  Swal.fire({
    title: 'Saldo Negativo',
    text: 'Su saldo ha quedado en negativo. ¡Cuidado con los gastos!',
    icon: 'warning',
  });
}

function showCongratulationsAlert(totalExpenses) {
  const savings = dailyExpenses[0] - totalExpenses;
  if (savings >= 0) {
    Swal.fire({
      title: '¡Felicidades!',
      html: `<p>Ha logrado ahorrar: $${savings.toFixed(2)}</p>`,
      icon: 'success',
    });
  }
}

function showSummary(totalExpenses) {
  const initialMoney = dailyExpenses[0];
  const totalSavings = initialMoney - totalExpenses;

  let summaryText = `<p>Saldo Inicial: $${initialMoney.toFixed(2)}</p>`;
  dailyExpenses.slice(1).forEach((expense) => {
    summaryText += `<p>Día ${expense.day}: $${expense.expense.toFixed(2)} (${expense.category})</p>`;
  });

  summaryText += `<p>Ahorro Total: $${totalSavings.toFixed(2)}</p>`;

  Swal.fire({
    title: 'Resumen de Gastos',
    html: summaryText,
    icon: 'info',
  });
}

async function trackDailyExpense(day) {
  try {
    const expenseData = await showExpenseAlert(day);
    dailyExpenses.push({ day, ...expenseData });
  } catch (error) {
    Swal.fire('Error', error, 'error');
  }
}

async function trackExpenses() {
  const initialMoney = parseFloat(document.getElementById('initialMoney').value);
  const totalDays = parseInt(document.getElementById('totalDays').value);

  if (isNaN(initialMoney) || initialMoney <= 0) {
    Swal.fire('Error', 'Ingrese un dinero inicial válido', 'error');
    return;
  }

  if (isNaN(totalDays) || totalDays <= 0) {
    Swal.fire('Error', 'Ingrese un número de días válido', 'error');
    return;
  }

  days = totalDays;
  dailyExpenses = [initialMoney];

  for (let i = 1; i <= days; i++) {
    await trackDailyExpense(i);
  }

  const totalExpenses = dailyExpenses.slice(1).reduce((total, item) => total + item.expense, 0);
  showSummary(totalExpenses);
  showCongratulationsAlert(totalExpenses);
  if (totalExpenses > initialMoney) {
    showNegativeBalanceAlert();
  }
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


document.getElementById('startTracking').addEventListener('click', () => {
  trackExpenses();
});

