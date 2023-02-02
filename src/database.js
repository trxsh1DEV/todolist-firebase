// Módulo relacionado as tarefas e ao BD em geral

import {
  ref,
  set,
  push,
  onValue,
  remove,
  update,
  orderByChild,
  query,
  startAt,
  limitToFirst,
  endAt,
  refFromURL,
} from "firebase/database";
import { auth, db, showError, firebaseApp, showItem, hideItem } from "./index";
import {
  getDownloadURL,
  getStorage,
  ref as refStorage,
  uploadBytesResumable,
  deleteObject
} from "firebase/storage";

const todoForm = document.querySelector("#todoForm");
const ulTodoList = document.querySelector("#ulTodoList");
const todoCount = document.querySelector("#todoCount");
const search = document.querySelector(".search");
const progressFeedback = document.querySelector(".progress-feedback");
const progress = document.querySelector(".progress");
const playPauseBtn = document.querySelector("#btn-pause");
const BtnCancel = document.querySelector("#btn-cancel");
const cancelUpdateTodo = document.querySelector("#cancelUpdateTodo");
const todoFormTitle = document.querySelector("#todoFormTitle");
const submitTodoForm = document.querySelector("#submitTodoForm");
const btnCancelChanged = document.querySelector("#btnCancelChanged");
const btnConfirmChanged = document.querySelector("#btnConfirmChanged");

const myDbRefence = () => ref(db, `users/${auth.currentUser.uid}`);
const userCurrent = () => auth.currentUser.uid;
const random = () => Math.floor(Math.random() * 10000 + 1000);

todoForm.onsubmit = (e) => {
  e.preventDefault();

  if (todoForm.name.value != "") {
    // let file = todoForm.file.files[0]; // seleciona apenas o primeiro arquivo
    addAllFields();
  }
  else alert("O campo da tarefa não pode estar em branco");
};

const addAllFields = () => {
  // console.log(push(myDbRefence()).key);
  let file = todoForm.file.files[0];
      if (file != null) {
      // if(file.type.includes('image')) se n tivessemos validado no html poderiamos filtrar se o usuário estava inserindo uma imagem cm esse code

      let storage = getStorage(firebaseApp);
      let storageRef = refStorage(
        storage,
        `todoListFiles/${userCurrent()}/${push(myDbRefence()).key}_${file.name}`
        // `todoListFiles/${userCurrent()}/${random()}_${file.name}`
      );
      // let upload = uploadBytesResumable(storageRef, file)
      // .catch((err) => showError('Falha ao fazer upload de imagem', err))

      let upload = uploadBytesResumable(storageRef, file);
      // Enviando a imagem para ser tratada e upada por essa function com uma Promise criada por nós e se a Promise retornar resolve faremos o resto da operação
      trackUpload(upload).then(() => {
        // pegando URL da imagem recém upada
        getDownloadURL(storageRef)
        .then((downloadUrl) => {
          addTask(todoForm.name.value, downloadUrl, myDbRefence()); // add os campos de txt (tarefa) e imagem para serem add
        }).catch((err) => showError('Falha ao fazer upload da imagem', err));
        todoForm.file.value = ''; // Zerando o campo "file" após ele ser enviado e add as tasks
      })
      .catch((err) => {
        showError('Falha ao tentar adicionar tarefa (verifique se o texto e imagem são validos): ', err);
      })

    } else {
      // Se o formulário tiver apenas uma tarefa (txt);
      addTask(todoForm.name.value, false, myDbRefence());
    }
}

const trackUpload = (upload) => {
  // Criando Promise personalizada (isso é para podermos anexar nossas imagens dps de upadas com sucesso nas tarefas)
  return new Promise((resolve, reject) => {
    showItem(progressFeedback); // exibindo barra de progresso qnd uparmos uma imagem
    // Rastreinado progresso (status) do upload
    upload.on(
      "state_changed",
      (snapshot) => {
        // console.log(snapshot);
        progress.value =
          (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        // console.log(`Upload is ${progress.value.toFixed(2)}% done`)
        // switch (snapshot.state) {
        //   case "paused":
        //     alert("upload is paused");
        //     break;
        //   case "running":
        //     console.log("upload is running");
        //     break;
        // }
      },
      (err) => {
        /* Exemplo dos possíveis erros ao fazer um upload
        switch (error.code) {
        case 'storage/unauthorized':
          // User doesn't have permission to access the object
          break;
        case 'storage/canceled':
          // User canceled the upload
          break;

        // ...

        case 'storage/unknown':
          // Unknown error occurred, inspect error.serverResponse
          break;
      }
      */
        // showError("Falha ao fazer upload da imagem: ", err);
        hideItem(progressFeedback);
        reject(err);
      },

      () => {
        console.log("upload success");
        hideItem(progressFeedback);
        resolve();
      }
    );

    let playPauseUpload = true; // Estado do upload (pausado ou em andamento)

    playPauseBtn.addEventListener("click", () => {
      playPauseUpload = !playPauseUpload; // invertendo o estado do nosso upload (false)

      if (playPauseUpload) {
        upload.resume(); // Retoma o upload
        playPauseBtn.innerHTML = "Pausar";
        console.log("Upload retomado");
      } else {
        upload.pause(); // Pausa upload
        playPauseBtn.innerHTML = "Continuar";
        console.log("Upload pausado");
      }
    });

    BtnCancel.addEventListener("click", () => cancelFile(upload));
  });
};
const cancelFile = (upload) => {
  upload.cancel();
  // alert("Upload cancelado pelo usuário");
  hideItem(progressFeedback);
  resetTodoForm();
};

const addTask = (task, downloadUrl) => {
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

  const newPost = myDbRefence();
  const newPostRef = push(newPost);
  // console.log(downloadUrl);
  // Se existir uma URL (que no nosso caso é referente a imagem que foi upada no storage) puxe ela pela URL (Link)
  if(downloadUrl){
    set(newPostRef, {
      imgUrl: downloadUrl,
      tarefas: task,
      taskLowerCase: task.toLowerCase(),
    })
  } else {
    set(newPostRef, {
      tarefas: task,
      taskLowerCase: task.toLowerCase(),
    })
  }
};

// Exibe a lista de tarefas
function fillTodoList() {
  // let dbReference = ref(db, `users/${auth.currentUser.uid}`);
  // const test2 = query(dbReference, orderByValue());
  const dbReference = myDbRefence();
  const test2 = dbReference;
  showFront(test2, true);

  // onValue(test2, (snap) => {
  //     // console.log(snap);
  //         todoCount.innerHTML = `Você tem ${snap.size} tarefas`;
  //         ulTodoList.innerHTML = '';
  //         snap.forEach(childSnapShot => {
  //             childData = (childSnapShot.val().tarefas)
  //             // console.log(childData);

  //             const spanLi = document.createElement("span");
  //             const li = document.createElement("li");

  //             childData = childSnapShot.val().tarefas;

  //             spanLi.appendChild(document.createTextNode(childData));

  //             // Definindo um id para o spanLi (tarefa) baseado no ID da BD
  //             spanLi.id = childSnapShot.key;
  //             li.appendChild(spanLi);
  //             ulTodoList.appendChild(li);

  //             // Button of removed task
  //             const liRemoveBtn = document.createElement("button");
  //             liRemoveBtn.appendChild(document.createTextNode('Excluir')) // Criando texto do botão
  //             // liRemoveBtn.setAttribute('onclick', `removeTodo(\"${childSnapShot.key}\")`)
  //             liRemoveBtn.setAttribute('class', 'danger todoBtn'); // Setando classes para estilizar o botão
  //             li.appendChild(liRemoveBtn); // add o botão de remoção na li
  //             liRemoveBtn.addEventListener('click', () => {
  //                 removeTodo(childSnapShot.key);
  //             });

  //             // Button of updating data
  //             const updateBtn = document.createElement("button");
  //             updateBtn.appendChild(document.createTextNode('Editar'))
  //             updateBtn.setAttribute('class', 'todoBtn');
  //             li.appendChild(updateBtn); // add o botão de edição na li
  //             updateBtn.addEventListener('click', () => {
  //                 updateTodo(childSnapShot.key);
  //             });
  //         });
  //         todoForm.reset();
  //     })

  // Lendo dados em tempo real
  // onValue(dbReference, (snapshot) => {
  //     todoCount.innerHTML = `Você tem ${snapshot.size} tarefas`;
  //     ulTodoList.innerHTML = '';

  //     snapshot.forEach((childSnapShot) => {
  //         console.log(childSnapShot.val());
  //         // Obtendo e exibindo os dados do usuário no HTML
  //         const spanLi = document.createElement("span");
  //         const li = document.createElement("li");

  //         childData = childSnapShot.val().tarefas;

  //         spanLi.appendChild(document.createTextNode(childData));

  //         // Definindo um id para o spanLi (tarefa) baseado no ID da BD
  //         spanLi.id = childSnapShot.key;
  //         li.appendChild(spanLi);
  //         ulTodoList.appendChild(li);

  //         // Button of removed task
  //         const liRemoveBtn = document.createElement("button");
  //         liRemoveBtn.appendChild(document.createTextNode('Excluir')) // Criando texto do botão
  //         // liRemoveBtn.setAttribute('onclick', `removeTodo(\"${childSnapShot.key}\")`)
  //         liRemoveBtn.setAttribute('class', 'danger todoBtn'); // Setando classes para estilizar o botão
  //         li.appendChild(liRemoveBtn); // add o botão de remoção na li
  //         liRemoveBtn.addEventListener('click', () => {
  //             removeTodo(childSnapShot.key);
  //         });

  //         // Button of updating data
  //         const updateBtn = document.createElement("button");
  //         updateBtn.appendChild(document.createTextNode('Editar'))
  //         updateBtn.setAttribute('class', 'todoBtn');
  //         li.appendChild(updateBtn); // add o botão de edição na li
  //         updateBtn.addEventListener('click', () => {
  //             updateTodo(childSnapShot.key);
  //         });

  //     });
  //     todoForm.reset();
  // });

  // Toda vez que houver qualquer mudança de valor nas tasks (add, editar, excluir), vamos chamar essa função que lê os dados (em tempo real) - É menos otimizado, mas dependendo da aplicação é um excelente recurso
  // Mas quanto maior a aplicação melhor seria a performance do "get" por não ficar fazendo esse monitoramento em tempo real
  // onChildChanged(newDbReference, (snapshot) => {
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
}

const listData = () => {
  const dbReference = myDbRefence();
  let searchText = search.value.toLowerCase();
  // ulTodoList.innerHTML = '';
  // let childData = '';
  const test2 = query(
    dbReference,
    orderByChild("taskLowerCase"),
    startAt(searchText),
    endAt(searchText + "\uf8ff"),
    limitToFirst(5)
  );
  showFront(test2, false);

  // Outros métodos de listagem (o get não é em tempo real)
  // onValue(test2, (snap) => {
  //     snap.forEach(childSnapShot => {
  //         childData = (childSnapShot.val().tarefas)
  //         // console.log(childData);

  //         const spanLi = document.createElement("span");
  //         const li = document.createElement("li");

  //         childData = childSnapShot.val().tarefas;

  //         spanLi.appendChild(document.createTextNode(childData));

  //         // Definindo um id para o spanLi (tarefa) baseado no ID da BD
  //         spanLi.id = childSnapShot.key;
  //         li.appendChild(spanLi);
  //         ulTodoList.appendChild(li);

  //         // Button of removed task
  //         const liRemoveBtn = document.createElement("button");
  //         liRemoveBtn.appendChild(document.createTextNode('Excluir')) // Criando texto do botão
  //         // liRemoveBtn.setAttribute('onclick', `removeTodo(\"${childSnapShot.key}\")`)
  //         liRemoveBtn.setAttribute('class', 'danger todoBtn'); // Setando classes para estilizar o botão
  //         li.appendChild(liRemoveBtn); // add o botão de remoção na li
  //         liRemoveBtn.addEventListener('click', () => {
  //             removeTodo(childSnapShot.key);
  //         });

  //         // Button of updating data
  //         const updateBtn = document.createElement("button");
  //         updateBtn.appendChild(document.createTextNode('Editar'))
  //         updateBtn.setAttribute('class', 'todoBtn');
  //         li.appendChild(updateBtn); // add o botão de edição na li
  //         updateBtn.addEventListener('click', () => {
  //             updateTodo(childSnapShot.key);
  //         });
  //     });
  // })

  // get(test2)
  // .then((snap) => {
  //     snap.forEach(childSnapShot => {
  //         childData = (childSnapShot.val().tarefas)
  //         // console.log(childData);

  //         const spanLi = document.createElement("span");
  //         const li = document.createElement("li");

  //         childData = childSnapShot.val().tarefas;

  //         spanLi.appendChild(document.createTextNode(childData));

  //         // Definindo um id para o spanLi (tarefa) baseado no ID da BD
  //         spanLi.id = childSnapShot.key;
  //         li.appendChild(spanLi);
  //         ulTodoList.appendChild(li);

  //         // Button of removed task
  //         const liRemoveBtn = document.createElement("button");
  //         liRemoveBtn.appendChild(document.createTextNode('Excluir')) // Criando texto do botão
  //         // liRemoveBtn.setAttribute('onclick', `removeTodo(\"${childSnapShot.key}\")`)
  //         liRemoveBtn.setAttribute('class', 'danger todoBtn'); // Setando classes para estilizar o botão
  //         li.appendChild(liRemoveBtn); // add o botão de remoção na li
  //         liRemoveBtn.addEventListener('click', () => {
  //             removeTodo(childSnapShot.key);
  //         });

  //         // Button of updating data
  //         const updateBtn = document.createElement("button");
  //         updateBtn.appendChild(document.createTextNode('Editar'))
  //         updateBtn.setAttribute('class', 'todoBtn');
  //         li.appendChild(updateBtn); // add o botão de edição na li
  //         updateBtn.addEventListener('click', () => {
  //             updateTodo(childSnapShot.key);
  //         });
  //     });
  // });

  // Forma auternativa (da na mesma )
  // return onValue(test2, (snapshot) => {
  //     snapshot.forEach((snap) => {
  //         const x = snap.val().tarefas;
  //         console.log(x);
  //     })
  //   }, {
  //     onlyOnce: true
  //   });
};

// Função responsável por exibir e filtrar as tarefas
const showFront = (test, listAll) => {
  // const dbReference = myDbRefence();
  // let searchText = search.value.toLowerCase();
  //const test = query(dbReference, orderByChild("taskLowerCase"), startAt(searchText), endAt(searchText + '\uf8ff'), limitToFirst(5));
  ulTodoList.innerHTML = "";
  // let childData = "";
  const test2 = test;

  // Exibindo e filtrando as tarefas
  onValue(test2, (snap) => {
    // if (listAll) {
      // todoCount.innerHTML = `Você tem ${snap.size} tarefas`;
      // ulTodoList.innerHTML = "";
    // }
    todoCount.innerHTML = `Você tem ${snap.size} tarefas`;
    ulTodoList.innerHTML = "";
    snap.forEach((childSnapShot) => {
      const childData = childSnapShot.val().tarefas;
      const imgData = childSnapShot.val().imgUrl;
      const spanLi = document.createElement("span");
      const li = document.createElement("li");
      li.id = childSnapShot.key; // o id do li vai definir como selecionamos uma tarefa, assim podendo alterar a tarefa e imagem

      let imgLi = document.createElement("img");
      // Configurando o src(origem da imagem) como a URL da imagem anexada a tarefa, se n tiver img terá então a imagem default
      imgLi.src = imgData ? imgData : 'uploads/defaultTodo.png'; // dentro do childData temos os valores das nossas chaves do BD (tasks, imgUrl)
      imgLi.setAttribute('class', 'imgTodo'); // classe para selecionarmos e estilizarmos a img
      li.appendChild(imgLi); // add img dentro do li (juntamente a task);

      spanLi.appendChild(document.createTextNode(childData));
      // Definindo um id para o spanLi (tarefa) baseado no ID da BD
      // spanLi.id = childSnapShot.key;

      li.appendChild(spanLi);
      ulTodoList.appendChild(li);

      // Button of removed task
      const liRemoveBtn = document.createElement("button");
      liRemoveBtn.appendChild(document.createTextNode("Excluir")); // Criando texto do botão
      // liRemoveBtn.setAttribute('onclick', `removeTodo(\"${childSnapShot.key}\")`)
      liRemoveBtn.setAttribute("class", "danger todoBtn"); // Setando classes para estilizar o botão
      li.appendChild(liRemoveBtn); // add o botão de remoção na li
      liRemoveBtn.addEventListener("click", () => {
        removeTodo(childSnapShot.key);
      });

      // Button of updating data
      const updateBtn = document.createElement("button");
      updateBtn.appendChild(document.createTextNode("Editar"));
      updateBtn.setAttribute("class", "todoBtn");
      li.appendChild(updateBtn); // add o botão de edição na li
      updateBtn.addEventListener("click", () => {
        updateTodo(childSnapShot.key);
      });
    });
    if (listAll) todoForm.reset();
  });
};

// Remove tarefas
const removeTodo = (key) => {
  const dbReference = ref(db, `users/${userCurrent()}/${key}`);
  // let selectedItem = document.querySelector(`#${key}`); // seleciona a li completa com task e img
  let todoName = document.querySelector(`#${key} > span`); // pegando span que está dentro da li, baseado no id(key) do elemento
  let todoImg = document.querySelector(`#${key} > img`); // pegando img que está dentro da li, baseado no id(key) do elemento

  let confirmation = confirm(
    `Deseja realmente remover a tarefa "${todoName.innerHTML}"?`
  );
  if (confirmation) {
    remove(dbReference)
      // .then(() => alert('Task removed'))
      .catch((err) => showError("Falha ao tentar remover a tarefa", err));
      removeFile(todoImg.src) // Removendo a img associada a essa task baseado no src que é origem da img (nesse caso a URL do storage)
  }
};
// Restaura estado inicial do formulário de tarefas

const resetTodoForm = () => {
  todoFormTitle.innerHTML = 'Adicionar tarefa',
  hideItem(cancelUpdateTodo);
  submitTodoForm.style.display = 'initial' // Caso a parte onde setar o display como 'block' ia atrapalhar o posicionamento do button

  todoForm.name.value = '';
  todoForm.file.value = '';
};

let updateTodoKey = null // variável global
// Prepara o formulário para a atualização de tarefas
const updateTodo = (key) => {
  // resetTodoForm();
  updateTodoKey = key; // atribui key dentro da váriavel global pra ser usada por outras functions (confirm e cancel update)
  // console.log(updateTodoKey, key);
  // const dbReference = ref(db, `users/${userCurrent()}/${key}`); // atribui o key dentro da referencia do BD
  let todoName = document.querySelector(`#${key} > span`);

  // Mudando o titulo e o contéudo dentro do input de "name"
  todoFormTitle.innerHTML = `<strong>Editar a tarefa</strong>: ${todoName.innerHTML}`
  todoForm.name.value = todoName.innerHTML;

  hideItem(submitTodoForm);
  showItem(cancelUpdateTodo)
};
// Botão de cancelar alterações (mudanças)
btnCancelChanged.addEventListener("click", () => {
  resetTodoForm();
});

// Botão de confirmar mudanças
btnConfirmChanged.addEventListener("click", () => {
  hideItem(cancelUpdateTodo);
  if(todoForm.name.value != ''){
    return confirmTodoUpdate();
  } else {
    alert('Você não pode alterar uma tarefa vazia');
    return resetTodoForm();
  };
});

// Remove arquivos (imagens)
const removeFile = (imgUrl) => {
  let todoImg = document.querySelector(`#${updateTodoKey} > img`); // pegando img atual selecionada pelo key
  // se dentro do src da nossa img contiver o valor referente ao caminho da imagem padrão, não fazemos nd, pois essa img n está no nosso storage e sim no nosso código
  // a função indexOf pega só o primeiro caractere, mas como tudo que está hospedado no storage começa com "https" esse primeiro "u" de uploads vai servir pra distinguirmos
  let result = imgUrl.indexOf('uploads/defaultTodo.png');
  // Se o começo do indexOf não começar "u", ele vai retornar -1 que seria equivalente um "false"
  // Se a imagem não for a imagem padrão, exclua a img do storage
  if(result == -1) {
    let storage = getStorage(firebaseApp);
    let storageRef = refStorage(storage,`${imgUrl}`);

    // Parei aqui
    // let linkImgUrl = imgUrl;
    // let finalImgUrl = linkImgUrl.substring(137, 137 + 15);
    // let linkTodoImg = todoImg.src;
    // let finalTodoImg = linkTodoImg.substring(137, 137 + 15);
    // console.log(finalImgUrl);
    // console.log(finalTodoImg);
    // if(finalImgUrl == finalImgUrl){
    //   console.log('imagens identicas, não deletetar do storage');
    //   return false;
    // }


    // Deletando imagem do storage
    deleteObject(storageRef)
    .then(() => console.log('imagem removida'))
    .catch((err) => console.log(err.message))

    resetTodoForm(); // após update da tarefa resetar o formulário
  } else {
    console.log('Nenhuma imagem removida');
  }
};

// Confirma a atualização das tarefas
const confirmTodoUpdate = () => {
  // console.log(updateTodoKey);
  hideItem(cancelUpdateTodo);
    let todoImg = document.querySelector(`#${updateTodoKey} > img`); // pegando img atual selecionada pelo key
    let file = todoForm.file.files[0];
    if (file != null) {
    // if(file.type.includes('image')) se n tivessemos validado no html poderiamos filtrar se o usuário estava inserindo uma imagem cm esse code
    let storage = getStorage(firebaseApp);
    let storageRef = refStorage(storage,`todoListFiles/${userCurrent()}/${updateTodoKey}_${file.name}`);

    let upload = uploadBytesResumable(storageRef, file);

    trackUpload(upload).then(() => {
      getDownloadURL(storageRef).then((downloadUrl) => {
        let data = {
          imgUrl: downloadUrl,
          tarefas: todoForm.name.value,
          taskLowerCase: todoForm.name.value.toLowerCase()
        };

        completeTodoUpdate(data, todoImg.src); // Completa a atualização de tarefas (persiste os dados no BD)
      })
    }).catch((err) => showError('Falha ao atualizar tarefa', err));

    } else { // se nenhuma imagem for selecionada uma img)
      let data = {
        tarefas: todoForm.name.value,
        taskLowerCase: todoForm.name.value.toLowerCase()
      };

      completeTodoUpdate(data); // Completa a atualização de tarefas (persiste os dados no BD)
    };
};

const completeTodoUpdate = (data, imgUrl) =>{
  const dbReference = ref(db, `users/${userCurrent()}/${updateTodoKey}`);
  console.log(updateTodoKey);

  if(imgUrl){
    console.log('exist image');
    removeFile(imgUrl); // pegando src q no caso contém a url da img no storage, se existir uma img, remova-a
  };

  update(dbReference, data)
  .then(() => {
    console.log('changed ok');
  })
  .catch((err) => showError('erro final', err));
  console.log('final',updateTodoKey);
  // Removendo imagem (storage)
  resetTodoForm(); // após update da tarefa resetar o formulário
}

// Atualizando somente as tarefas (txt)
// const updateTodo2 = (key) => {
//   const dbReference = ref(db, `users/${userCurrent()}/${key}`);
//   let selectedItem = document.querySelector(`#${key}`);
//   let newTodo = prompt(
//     `Digite o nome da nova tarefa "${selectedItem.innerHTML}: "`,
//     selectedItem.innerHTML
//   );

//   if (newTodo == "") return alert("Este campo não pode ficar vazio");

//   let data = {
//     tarefas: newTodo,
//     taskLowerCase: newTodo.toLowerCase(),
//   };
//   // Atualizando a tarefa
//   update(dbReference, data)
//     // .then(() => console.log('task add successfully'))
//     .catch((err) => showError("Falha ao atualizar a tarefa", err));
// };



export { addTask, fillTodoList, listData, progressFeedback };

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
