const DarkMode = {
  mode: 0,
  buttonDarkMode: document.querySelector('.change-mode'),
  updateBodyClasses(classToAdd, classToRemove) {
    document.documentElement.classList.add(classToAdd);
    document.documentElement.classList.remove(classToRemove);
  },
  changeMode() {
    localStorage.setItem('dev.finances:mode', JSON.stringify(this.mode));
    
    if (this.mode)  {
      this.updateBodyClasses('dark', 'light');
      this.buttonDarkMode.src = './assets/sun.svg';
      this.mode = 0;
    } else {
      this.updateBodyClasses('light', 'dark');
      this.buttonDarkMode.src = './assets/moon.svg';
      this.mode = 1;
    }
  },
  verifyModeOnStorage() {
    const mode = JSON.parse(localStorage.getItem('dev.finances:mode')) || this.mode;
    localStorage.setItem('dev.finances:mode', JSON.stringify(mode));

    if (mode) {
      this.updateBodyClasses('dark', 'light');
      this.buttonDarkMode.src = './assets/sun.svg';
      this.mode = 0;
    } else {
      this.updateBodyClasses('light', 'dark');
      this.buttonDarkMode.src = './assets/moon.svg';
      this.mode = 1;
    }
  },
  init() {
    this.verifyModeOnStorage();
    this.changeMode = this.changeMode.bind(this);
    this.buttonDarkMode.addEventListener('click', this.changeMode);
  }
}

const Storage = {
  getByIndex(index) {
    const transactions = this.get();
    return transactions[index];
  },
  get() {
    return JSON.parse(localStorage.getItem('dev.finances:transactions')) || [];
  },
  set(transactions) {
    localStorage.setItem('dev.finances:transactions', JSON.stringify(transactions));
  },
}

const Order = {
  isDescriptionNormalOrder: false,
  isAmountNormalOrder: false,
  isDateNormalOrder: false,
  byDescription() {
    const transactions = Storage.get();
    console.log(transactions)
    let itemsOrderedByDescription = transactions.sort((a, b) => {
      return (a.description > b.description) 
        ? 1 : (b.description > a.description) ? -1 : 0;
    });

    if (this.isDescriptionNormalOrder) {
      itemsOrderedByDescription = itemsOrderedByDescription.reverse();
      this.isDescriptionNormalOrder = false;
    } else {
      this.isDescriptionNormalOrder = true;
    }

    DOM.clearTransactions();
    itemsOrderedByDescription.forEach(DOM.addTransaction);
    Animations.tableDatas(0.2);
  },
  byAmount() {
    const transactions = Storage.get();
    let itemsOrderedByAmount = transactions.sort((a, b) => a.amount - b.amount);

    if (this.isAmountNormalOrder) {
      itemsOrderedByAmount = itemsOrderedByAmount.reverse()
      this.isAmountNormalOrder = false;
    } else {
      this.isAmountNormalOrder = true;
    }

    DOM.clearTransactions();
    itemsOrderedByAmount.forEach(DOM.addTransaction);
    Animations.tableDatas(0.2);
  },
  byDate() {
    const transactions = Storage.get();

    let itemsOrderedByDate = transactions.sort((a, b) => {
      const { date: aDateUnformatted } = a;
      const { date: bDateUnformatted } = b;

      const [aDay, aMonth, aYear] = aDateUnformatted.split('/');
      const [bDay, bMonth, bYear] = bDateUnformatted.split('/');

      const aDate = new Date(`${aYear}-${aMonth}-${aDay}`).getTime();
      const bDate = new Date(`${bYear}-${bMonth}-${bDay}`).getTime();

      return aDate - bDate;
    });

    if (this.isDateNormalOrder) {
      itemsOrderedByDate = itemsOrderedByDate.reverse();
      this.isDateNormalOrder = false;
    } else {
      this.isDateNormalOrder = true;
    }

    DOM.clearTransactions();
    itemsOrderedByDate.forEach(DOM.addTransaction);
    Animations.tableDatas(0.2);
  },
}

const Modal = {
  elements: {
    form: document.querySelector('form'),
    description: document.querySelector('input#description'),
    amount: document.querySelector('input#amount'),
    date: document.querySelector('input#date'),
  },
  open() {
    document
      .querySelector('.modal-overlay')
      .classList.add('active');
  },
  close() {
    document
      .querySelector('.modal-overlay')
      .classList.remove('active');
  },
  update() {
    this.open();
  },
}

const Transaction = {
  all: Storage.get(),
  add(transaction) {
    this.all.push(transaction);
    App.reload();
  },
  addByIndex(transaction, index) {
    this.all[index] = transaction;
    App.reload();
  },
  remove(index) {
    this.all.splice(index, 1);
    App.reload();
    Animations.tableDatas(0.1);
  },
  update(index) {
    const { amount, date, description } = Storage.getByIndex(index);

    const [day, month, year] = date.split('/');
    
    Modal.update();
    Modal.elements.form.setAttribute('data-update', index);
    Modal.elements.description.value = description;
    Modal.elements.amount.value = (amount / 100).toFixed(2);
    Modal.elements.date.value = `${year}-${month}-${day}`;
  },
  incomes() {
    return this.all.reduce((acc, { amount }) => {
      if (amount > 0) acc += amount;
      return acc;
    }, 0);
  },
  expenses() {
    return this.all.reduce((acc, { amount }) => {
      if (amount < 0) acc += amount;
      return acc;
    }, 0);
  },
  total() {
    return this.incomes() + this.expenses();
  },
}

const DOM = {
  transactionsContainer: document.querySelector('#data-table tbody'),
  addTransaction(transaction, index) {
    const tr = document.createElement('tr');
    tr.innerHTML = DOM.innerHTMLTransaction(transaction, index);
    tr.dataset.index = index;

    DOM.transactionsContainer.appendChild(tr);
  },
  innerHTMLTransaction(transaction, index) {
    const CSSclass = transaction.amount > 0 ? 'income' : 'expense';    
    const amount = Utils.formatCurrency(transaction.amount)

    const html = `
      <td class="description">${transaction.description}</td>
      <td class="${CSSclass}">${amount}</td>
      <td class="date">${transaction.date}</td>
      <td>
        <img onclick="Transaction.remove(${(index)})" src="./assets/minus.svg" alt="Remover transação" ">
      </td>
      <td>
        <img onclick="Transaction.update(${(index)})" src="./assets/update.svg" alt="Atualizar transação" ">
      </td>
    `;

    return html;
  },
  updateBalance() {
    document.getElementById('incomeDisplay')
      .innerHTML = Utils.formatCurrency(Transaction.incomes());

    document.getElementById('expenseDisplay')
      .innerHTML = Utils.formatCurrency(Transaction.expenses());

    const totalDisplay = document.getElementById('totalDisplay');
    const cardTotal = totalDisplay.parentNode;
    const totalBalance = Transaction.total();
    
    cardTotal.classList.remove('positive');
    cardTotal.classList.remove('negative');

    if (totalBalance > 0) cardTotal.classList.add('positive');
    else if (totalBalance < 0) cardTotal.classList.add('negative');
    
    totalDisplay.innerHTML = Utils.formatCurrency(totalBalance);
  },
  clearTransactions() {
    this.transactionsContainer.innerHTML = '';
  },
}

const Utils = {
  formatDate(date) {
    const splittedDate = date.split('-');
    return `${splittedDate[2]}/${splittedDate[1]}/${splittedDate[0]}`;
  },
  formatAmount(value) {
    value = value * 100;
    return Math.round(value);
  },
  formatCurrency(value) {
    const signal = Number(value) < 0 ? '-' : '';
    value = String(value).replace(/\D/g, '');
    value = Number(value) / 100;
    value = value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    return signal + value;
  },
}

const Animations = {
  table() {
    const tableRows = document.querySelectorAll('thead tr, tbody tr');
    let index = 0, delay = 0.3;

    setTimeout(() => {
      const tableAnimationInterval = setInterval(() => {
        if (tableRows[index]) {
          tableRows[index].style.animation = `animate-table ${delay}s`;
          tableRows[index].style.opacity = 0.7;
          delay += 0.3;
          index++;
          Animations.tableDatasMouseHover();
        } else {
          clearInterval(tableAnimationInterval);
        }
      }, 100);
    }, 1000);
  },
  tableDatas(timeout = 1) {
    const tableDataRows = document.querySelectorAll('tbody tr');
    let index = 0, delay = 0.3;

    setTimeout(() => {
      const tableAnimationInterval = setInterval(() => {
        if (tableDataRows[index]) {
          tableDataRows[index].style.animation = `animate-table ${delay}s`;
          tableDataRows[index].style.opacity = 0.7;
          delay += 0.3;
          index++;
          Animations.tableDatasMouseHover();
        } else {
          clearInterval(tableAnimationInterval);
        }
      }, 100);
    }, timeout * 1000);
  },
  tableDatasMouseHover() {
    const tableDataRows = document.querySelectorAll('tbody tr');
    tableDataRows.forEach((tableDataRow) => {
      tableDataRow.addEventListener('mouseover', () => {
        tableDataRow.style.opacity = 1;
      });
      tableDataRow.addEventListener('mouseleave', () => {
        tableDataRow.style.opacity = 0.7;
      });
    });
  },
}

const Form = {
  description: document.querySelector('input#description'),
  amount: document.querySelector('input#amount'),
  date: document.querySelector('input#date'),
  getValues() {
    return {
      description: Form.description.value,
      amount: Form.amount.value,
      date: Form.date.value,
    };
  },
  validateFields() {
    const { description, amount, date } = this.getValues();
    
    if (description.trim() === '' 
      || amount.trim() === ''
      || date.trim() === '') {
        throw new Error('Por favor, preencha todos os campos!');
    }
  },
  formatValues() {
    let { description, amount, date } = this.getValues();
    amount = Utils.formatAmount(amount);
    date = Utils.formatDate(date);
    
    return { description, amount, date};
  },
  clearFields() {
    this.description.value = '';
    this.amount.value = '';
    this.date.value = '';
  },
  submit(e) {
    e.preventDefault();
    try {
      const form = e.target;
      const indexToUpdate = form.dataset.update;
      
      this.validateFields();
      const transaction = this.formatValues();
      
      if (indexToUpdate !== '' && indexToUpdate !== undefined) {
        Transaction.addByIndex(transaction, indexToUpdate);
        form.removeAttribute('data-update');
      } else {
        Transaction.add(transaction);
      }
      
      this.clearFields();
      Modal.close();
      Animations.tableDatas(0.1);
    } catch (error) {
      alert(error.message);
    }
  }
}

const App = {
  init() {
    Transaction.all.forEach(DOM.addTransaction);
    DOM.updateBalance();
    Storage.set(Transaction.all);
  },
  reload() {
    DOM.clearTransactions();
    this.init();
  },
}

App.init();
DarkMode.init();
Animations.table();
