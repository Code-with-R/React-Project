import React from 'react'
import {useSelector, useDispatch} from 'react-redux';
import {removeTodo, toggleComplete} from '../Features/Todo/TodoSlice.js';

function SimpleTodo() {
  const todos = useSelector((state) => state.todos);
  const dispatch = useDispatch();

  return (
    <div>
      {todos.map((todo) => (
        <div key={todo.id}>
          <span
            style={{ textDecoration: todo.completed ? 'line-through' : 'none' }}
          >
            {todo.text}
          </span>
          <button
            onClick={() => dispatch(toggleComplete(todo.id))}
          >
            {todo.completed ? 'Undo' : 'Complete'}
          </button>
          <button
            onClick={() => dispatch(removeTodo(todo.id))}
          >
            Delete
          </button>
        </div>
      ))}
    </div>
  )
}

export default SimpleTodo;