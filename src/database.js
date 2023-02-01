import { child, ref, set, push, onValue, get, onChildAdded, onChildChanged, remove, update, orderByChild, query, orderByValue, startAt, limitToFirst, endAt, orderByKey, limitToLast } from 'firebase/database';
import {auth, db, showError, dbRef } from './index';

const todoForm = document.querySelector('#todoForm');
const ulTodoList = document.querySelector('#ulTodoList');
const todoCount = document.querySelector('#todoCount');
const search = document.querySelector('.search');

const myDbRefence= () => {
    return ref(db, `users/${auth.currentUser.uid}`);
}


todoForm.onsubmit = (e) => {
    e.preventDefault();
    if(todoForm.name.value != ''){
    addTask(todoForm.name.value, auth.currentUser.uid);
    } else {
        alert('O campo da tarefa não pode estar em branco');
    }
}

const addTask = (task, userId) => {
    // const newDb = ref(db, 'users/')

    // sobreescreve task para o mesmo id
    // set(ref(db, 'users/' + userId), {
    //     teste: task
    // }).then(() => alert('foi')); 

    // Adiciona tasks para o mesmo id
    // push(ref(db, `users/`), {
    //     test: task,
    // }).then(() => alert('foi'))
    // .catch((err) => showError('Falha ao adicionar tarefa', err));

    const newPost = ref(db,`users/${auth.currentUser.uid}`);
    const newPostRef = push(newPost);
    set(newPostRef, {
        tarefas: task,
        taskLowerCase: task.toLowerCase()
    })
    // .then(() => console.log('Task add'))
    .catch((err) => showError('Falha ao adicionar tarefa', err))
    
}

// Exibe a lista de tarefas
function fillTodoList(test){
    let dbReference = ref(db, `users/${auth.currentUser.uid}`);
    ulTodoList.innerHTML = '';
    let childData = '';
    // let test2 = query(dbReference, orderByChild("tarefas"), startAt(search.value), endAt(search.value + '\uf8ff'), limitToFirst(5));


    // if(test){
    //     dbReference = test2;
    // }
    // Lendo dados em tempo real
    onValue(dbReference, (snapshot) => {
        todoCount.innerHTML = `Você tem ${snapshot.size} tarefas`;
        ulTodoList.innerHTML = '';

        snapshot.forEach((childSnapShot) => {
            // console.log(childData);
            // Obtendo e exibindo os dados do usuário no HTML
            const spanLi = document.createElement("span");
            const li = document.createElement("li");
            
            childData = childSnapShot.val().tarefas;

            spanLi.appendChild(document.createTextNode(childData));

            // Definindo um id para o spanLi (tarefa) baseado no ID da BD
            spanLi.id = childSnapShot.key;
            li.appendChild(spanLi);
            ulTodoList.appendChild(li);

            // Button of removed task
            const liRemoveBtn = document.createElement("button");
            liRemoveBtn.appendChild(document.createTextNode('Excluir')) // Criando texto do botão
            // liRemoveBtn.setAttribute('onclick', `removeTodo(\"${childSnapShot.key}\")`)
            liRemoveBtn.setAttribute('class', 'danger todoBtn'); // Setando classes para estilizar o botão
            li.appendChild(liRemoveBtn); // add o botão de remoção na li
            liRemoveBtn.addEventListener('click', () => {
                removeTodo(childSnapShot.key);
            });

            // Button of updating data
            const updateBtn = document.createElement("button");
            updateBtn.appendChild(document.createTextNode('Editar'))
            updateBtn.setAttribute('class', 'todoBtn');
            li.appendChild(updateBtn); // add o botão de edição na li
            updateBtn.addEventListener('click', () => {
                updateTodo(childSnapShot.key);
            });

        });
        todoForm.reset();
    });

    // Toda vez que houver uma mudança de valor nas tasks, vamos chamar essa função que lê os dados (em tempo real) - É menos otimizado, mas dependendo da aplicação é um excelente recurso
    // Mas quanto maior a aplicação melhor seria a performance do "get" por não ficar fazendo esse monitoramento em tempo real
    // onChildAdded(newDbReference, (snapshot) => {
    //     myTasks.innerHTML = '';
    //     let size = snapshot.size;
    //     todoCount.innerHTML = `Você tem ${size} tarefas`
    //     snapshot.forEach((childSnapShot) => {
    //         const childData = childSnapShot.val().tarefas;
    //         myTasks.innerHTML += `${childData}<br>`
    //     });
    // });
  
    // onChildAdded(newdb, (snapshot) => {
    //     myTasks.innerHTML = '';
    //     let size = snapshot.size;
    //     todoCount.innerHTML = `Você tem ${size} tarefas`
    //     snapshot.forEach((childSnapShot) => {
    //         const childData = childSnapShot.val().tarefas;
    //         myTasks.innerHTML += `<br>${childData}`
    //     });
    // });

};

const listData = () => {
    const dbReference = myDbRefence();     
    let searchText = search.value.toLowerCase();
        ulTodoList.innerHTML = '';
        let childData = '';
        const test2 = query(dbReference, orderByChild("taskLowerCase"), startAt(searchText), endAt(searchText + '\uf8ff'), limitToFirst(5));

        get(test2)
        .then((snap) => {
            snap.forEach(childSnapShot => {
                childData = (childSnapShot.val().tarefas)
                // console.log(childData);
                
                const spanLi = document.createElement("span");
                const li = document.createElement("li");
                
                childData = childSnapShot.val().tarefas;
    
                spanLi.appendChild(document.createTextNode(childData));
    
                // Definindo um id para o spanLi (tarefa) baseado no ID da BD
                spanLi.id = childSnapShot.key;
                li.appendChild(spanLi);
                ulTodoList.appendChild(li);
    
                // Button of removed task
                const liRemoveBtn = document.createElement("button");
                liRemoveBtn.appendChild(document.createTextNode('Excluir')) // Criando texto do botão
                // liRemoveBtn.setAttribute('onclick', `removeTodo(\"${childSnapShot.key}\")`)
                liRemoveBtn.setAttribute('class', 'danger todoBtn'); // Setando classes para estilizar o botão
                li.appendChild(liRemoveBtn); // add o botão de remoção na li
                liRemoveBtn.addEventListener('click', () => {
                    removeTodo(childSnapShot.key);
                });
    
                // Button of updating data
                const updateBtn = document.createElement("button");
                updateBtn.appendChild(document.createTextNode('Editar'))
                updateBtn.setAttribute('class', 'todoBtn');
                li.appendChild(updateBtn); // add o botão de edição na li
                updateBtn.addEventListener('click', () => {
                    updateTodo(childSnapShot.key);
                });
            });
        });

        // Forma auternativa (da na mesma )
        // return onValue(test2, (snapshot) => {
        //     snapshot.forEach((snap) => {
        //         const x = snap.val().tarefas;
        //         console.log(x);
        //     })
        //   }, {
        //     onlyOnce: true
        //   });
}
// Remove tarefas
const removeTodo = (key) => {
    const dbReference = ref(db, `users/${auth.currentUser.uid}/${key}`);
    let selectedItem = document.querySelector(`#${key}`)

    let confirmation = confirm(`Deseja realmente remover a tarefa "${selectedItem.innerHTML}"?`);
    if(confirmation){
        remove(dbReference)
        // .then(() => alert('Task removed'))
        .catch((err) => showError('Falha ao tentar remover a tarefa', err))
    } 
}

// Atualiza tarefas
const updateTodo = (key) => {
    const dbReference = ref(db, `users/${auth.currentUser.uid}/${key}`);
    let selectedItem = document.querySelector(`#${key}`)
    let newTodo = prompt(`Digite o nome da nova tarefa "${selectedItem.innerHTML}: "`, selectedItem.innerHTML);

    if(newTodo == '') return alert('Este campo não pode ficar vazio'); 

    let data = {
        tarefas: newTodo,
        taskLowerCase: newTodo.toLowerCase()
    };
    // Atualizando a tarefa
    update(dbReference, data)
    // .then(() => console.log('task add successfully'))
    .catch((err) => showError('Falha ao atualizar a tarefa', err));
}


export { addTask, fillTodoList, listData };



// Aprendizado de formas diferentes de obter os valores de uma arvóre (BD RealTime Database)
// const getTasks = () => {
//     let data;
//     // Lendo dados (sem ser em tempo real)
//     get(child(dbRef, `users/${auth.currentUser.uid}`))
//     .then((snapshot) => {
//         data = snapshot.val();
//         console.log(data);
//     })
//     .catch((err) => console.log(err.message));
// }

// // Uma das tentativas de pegar os valores dentro dos IDs aleatórios
// const onTasks = () => {
//     // Toda vez que houver uma mudança de valor nas tasks, vamos chamar essa função que lê os dados (em tempo real) - É menos otimizado, mas dependendo da aplicação é um excelente recurso
//     // Mas quanto maior a aplicação melhor seria a performance do "get" por não ficar fazendo esse monitoramento em tempo real

//     let testRef = ref(db, `users/${auth.currentUser.uid}`);
//     onValue(testRef, (snapshot) => {
//         snapshot.forEach((childSnapShot) => {
//             const childData = childSnapShot.val().tarefas;
//             console.log(childData);
//         });
//     });
// }

// const listenChild = () => {
//     const tasks = ref(db, `users/${auth.currentUser.uid}`);
//     onChildAdded(tasks, (data) => {
//         data.forEach((item) => {
//             // console.log(item.val());
//             console.log(item.val());
//         })
//     });
// }