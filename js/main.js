const url = 'https://graphqlzero.almansi.me/api'

const addForm = document.forms.addtask
const searchForm = document.forms.findtask
const todos = document.getElementById('todos')

const makeRequest = async (query) => {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-type': 'application/json' },
    body: JSON.stringify({ query })
  })
  return response.json()
}

const printTodo = ({ title, completed = false, id = '', user = {} }) => {
  const listItem = document.createElement('li')
  listItem.className = 'list-group-item'
  listItem.innerHTML = `&nbsp ${title} | ID: ${id} | by <b>${user.name}</b>`
  listItem.setAttribute('data-id', id)

  const checkbox = document.createElement('input')
  checkbox.type = 'checkbox'
  if (completed) {
    checkbox.setAttribute('checked', 'true')
  }
  checkbox.addEventListener('change', handleTodoStatus)
  listItem.prepend(checkbox)

  const deleteButton = document.createElement('button')
  deleteButton.className = 'btn btn-link mb-1'
  deleteButton.innerHTML = '&times;'
  deleteButton.addEventListener('click', handleDeleteTodo)
  listItem.append(deleteButton)

  todos.prepend(listItem)
}

makeRequest(`
query Todos {
  todos{
    data {
      id
      title
      completed
      user {
        name
      }
    }
  }
}
`).then(({ data }) => data.todos.data.forEach((todo) => printTodo(todo)))

const addTaskHandler = async (event) => {
  event.preventDefault()

  const taskName = addForm.taskname.value

  if (taskName) {
    const newTaskQuery = `
mutation CreateTodo {
  createTodo(input: { title: "${taskName}", completed: false }){
    title
    completed
    id
  }
}
`

    const response = await makeRequest(newTaskQuery)
    printTodo(response.data.createTodo)
    addForm.reset()
  }
}

const findTodos = async (event) => {
  event.preventDefault()

  const searchText = searchForm.searchname.value

  const searchQuery = `
query searchQuery {
  todos(options: {
    search: { q: "${searchText}" },
    sort: { field: "id", order: ASC }
  }) {
    data {
      id
      title
      completed
      user { name }
    }
  }
}
`

  const { data } = await makeRequest(searchQuery)

  data.todos.data.forEach((todo) => printTodo(todo))
}

async function handleTodoStatus () {
  const todoId = this.parentElement.dataset.id

  const changeStatusQuery = `
mutation ChangeStatus {
  updateTodo(id: "${todoId}", input: { completed: ${this.checked} }) {
    completed
  }
}
`

  const response = await makeRequest(changeStatusQuery)
  const isCompleted = response.data.updateTodo.completed

  if (isCompleted) {
    this.setAttribute('checked', 'true')
  } else {
    this.removeAttribute('checked')
  }
}

async function handleDeleteTodo () {
  const todoId = this.parentElement.dataset.id
  const deleteQuery = `
mutation DeleteTodo {
  deleteTodo(id: "${todoId}")
}
`
  const response = await makeRequest(deleteQuery)

  if (response.data.deleteTodo) {
    this.parentElement.remove()
  }
}

addForm.addEventListener('submit', addTaskHandler)
searchForm.addEventListener('submit', findTodos)
