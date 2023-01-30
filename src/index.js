import { initializeApp } from "firebase/app";
import { getAuth, signOut ,onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendEmailVerification, sendPasswordResetEmail } from 'firebase/auth';

const firebaseApp = initializeApp({
    apiKey: "AIzaSyBj4RHDMic71NXZgdAmdj6DiVMz_pqBdNg",
    authDomain: "todolist-c7650.firebaseapp.com",
    projectId: "todolist-c7650",
    storageBucket: "todolist-c7650.appspot.com",
    messagingSenderId: "745186816967",
    appId: "1:745186816967:web:285f2d6197c6a901425fe2"
});

const authForm = document.getElementById('authForm');
const authFormTitle = document.getElementById('authFormTitle');
const register = document.getElementById('register');
const access = document.getElementById('access');

const accessAccount = document.querySelector('#access-account');
// const registerAccount = document.querySelector('.alternative');
const quitUser = document.querySelector('.signout');
const loading = document.querySelector('.loading');
const authentication  = document.querySelector('#auth');
const userContent = document.querySelector('.userContent');
const userEmail = document.querySelector('#userEmail');
const emailVerified = document.querySelector('#emailVerified');
const verificationEmail = document.querySelector('#sendEmailVerificationDiv');
// Atributos Extras (Configuração de E-mail)
let actionCodeSettings = {
    url: "http://localhost:3000/"
};

const resetPassword = document.querySelector('#passwordReset');
const btnResetPassword = document.querySelector('#passwordReset button');

// AUTENTICAÇÃO
// Pegando o obj referente ao nosso BD de autenticações do usuário e obtendo o usuário atual
const auth = getAuth(firebaseApp);
// Traduzindo a autenticação para português 
auth.languageCode = 'pt-BR';

authForm.onsubmit = (e) => {
    showItem(loading);
    e.preventDefault();
    if(authForm.submitAuthForm.innerHTML == "Acessar"){
        signInWithEmailAndPassword(auth, authForm.email.value, authForm.password.value)
        // .then((user) => {
        //     console.log(user);
        //     console.log('Success');
        // })
        .catch((err) => {
            const errorCode = err.code;
            const errorMessage = err.message;
            console.log("Failed login");
            // console.log(errorCode, errorMessage);
        })
    } else {
        createUserWithEmailAndPassword(auth, authForm.email.value, authForm.password.value)
        // .then((userCredential) => {
        //     const user = userCredential.user;
        //     alert(`Parabéns por se cadastrar ${user.email}`)
        //     console.log('Usuário cadastrado com sucesso');
        // })
        .catch((err) => {
            const errorCode = err.code;
            const errorMessage = err.message;
            console.log("Falha ao criar conta");
            alert(errorMessage);
        })
    }
};
// Quando houver uma mudança de autenticação (se o usuário está autenticado ou n autenticado)
// Centralizando e tratando a autenticação (login e criação de usuários);
onAuthStateChanged(auth, (userC) => {
    hideItem(loading);
    const user = userC;
    // user ? console.log(user.email + '\nÉ um usuário autenticado') : console.log('Não autenticado');
    user ? showUserContent(user) : showAuth();
});

// Saindo da conta
quitUser.addEventListener('click', (e) => {
    quiting();
});
// Verificando e-mail do usuário que logou
verificationEmail.addEventListener('click', () => {
    makeVerificationEmail();
});

const quiting = () => {
    signOut(auth).then(() => {
        alert(`Usuário desconectado`);
    })
    .catch((err) => alert('Falha ao sair da conta'));
    authForm.reset();
}

// Função que faz a verificação de e-mail
const makeVerificationEmail = () => {
    showItem(loading);
    // const a = auth.currentUser.emailVerified;
    // Método que pertence ao objeto usuário
    sendEmailVerification(auth.currentUser, actionCodeSettings)
    .then(() => {
        alert(`E-mail de verificação foi enviado para ${auth.currentUser.email}! Verifique seu email!`);
    })
    .catch((err) =>{
        alert('Erro ao enviar e-mail de verificação');
        console.log(err.message);
    }).finally(function () {
        hideItem(loading);
    })
    console.log(`E-mail verificado? ${auth.currentUser.emailVerified}`);
};

// Reset de senha
btnResetPassword.addEventListener('click', () => {
    let mail = prompt('Para redefinir sua senha informe seu endereço de e-mail', authForm.email.value);
    // console.log(auth, mail, authForm.email.value);
    if(!mail) return alert('Preencha corretamente o campo com um e-mail válido');

    showItem(loading)
    sendPasswordResetEmail(auth, mail, actionCodeSettings)
    .then(() => {
        alert(`Foi enviado o link para redefinição de senha para o e-mail ${mail}`);
    })
    .catch((err) => {
        alert('Houve um erro ao enviar link de redefinição de senha para o e-mail inserido');
        console.log(err.message);
        console.log(err);
    })
    .finally(() => {
        hideItem(loading);
    })
});




// Dinamismo

// Alterar o formulário de autenticação para o cadastro de novas contas
function toggleToRegister() {
    authForm.submitAuthForm.innerHTML = 'Cadastrar conta';
    authFormTitle.innerHTML = 'Insira seus dados para se cadastrar';

    hideItem(register);
    hideItem(resetPassword);
    showItem(access);
};
function toggleToAccess() {
    authForm.submitAuthForm.innerHTML = 'Acessar'
    authFormTitle.innerHTML = 'Acesse a sua conta para continuar'

    hideItem(access);
    showItem(resetPassword);
    showItem(register);
};

register.addEventListener('click', (e) => {
    e.preventDefault();
    toggleToRegister();
})
accessAccount.addEventListener('click', (e) => {
    e.preventDefault();
    toggleToAccess();
})

// Alterar o formulário de autenticação para o acesso de contas já existentes

// Simpplifica a exibição de elementos da página
function showItem(element) {
    element.style.display = 'block'
}

// Simplifica a remoção de elementos da página
function hideItem(element) {
    element.style.display = 'none'
};

// Exibir conteúdo apenas para usuários autenticados;
const showUserContent = (user) => {
    // console.log(user);
    if(user.emailVerified){
        emailVerified.innerHTML = 'E-MAIL VERIFICADO'
        hideItem(verificationEmail);
    } else {
        emailVerified.innerHTML = 'E-MAIL NÃO VERIFICADO'
        showItem(verificationEmail);
    }

    userEmail.innerHTML = `${user.email}`;
    hideItem(authentication);
    showItem(userContent);
};
// Exibir para usuários NÃO autenticados;
const showAuth = () => {
    hideItem(userContent);
    showItem(authentication);
}

// FIM DA AUTENTICAÇÃO

