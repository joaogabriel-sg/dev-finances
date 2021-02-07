const DarkMode = {
  buttonDarkMode: document.querySelector('.change-mode'),
  updateBodyClasses(classToAdd, classToRemove) {
    document.documentElement.classList.add(classToAdd);
    document.documentElement.classList.remove(classToRemove);
  },
  changeMode() {
    if (document.documentElement.classList.contains('dark'))  {
      this.updateBodyClasses('light', 'dark');
      this.buttonDarkMode.src = './assets/moon.svg';
    }
    else {
      this.updateBodyClasses('dark', 'light');
      this.buttonDarkMode.src = './assets/sun.svg';
    }
  },
  init() {
    this.changeMode = this.changeMode.bind(this);
    this.buttonDarkMode.addEventListener('click', this.changeMode);
  }
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
    document
      .getElementById('incomeDisplay')
      .innerHTML = Utils.formatCurrency(Transaction.incomes());

    document
      .getElementById('expenseDisplay')
      .innerHTML = Utils.formatCurrency(Transaction.expenses());
    
      document
      .getElementById('totalDisplay')
      .innerHTML = Utils.formatCurrency(Transaction.total());
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
    } catch (error) {
      alert(error.message);
    }
  }
}

const App = {
  init() {
    DarkMode.init();
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
