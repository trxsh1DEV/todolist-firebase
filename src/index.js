
import { initializeApp } from "firebase/app";
import { getAuth, signOut ,onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendEmailVerification, sendPasswordResetEmail, signInWithPopup, GoogleAuthProvider, signInWithRedirect, GithubAuthProvider, FacebookAuthProvider, updateProfile } from 'firebase/auth';
import { getDatabase, ref} from 'firebase/database';
import { addTask } from './database';


const firebaseApp = initializeApp({
    apiKey: "AIzaSyBj4RHDMic71NXZgdAmdj6DiVMz_pqBdNg",
    authDomain: "todolist-c7650.firebaseapp.com",
    projectId: "todolist-c7650",
    storageBucket: "todolist-c7650.appspot.com",
    messagingSenderId: "745186816967",
    appId: "1:745186816967:web:285f2d6197c6a901425fe2"
});

// Exports para outros módulos

let db = getDatabase(firebaseApp);
let dbRef = ref(db, 'users');

export {db, dbRef, auth};


// Fim exports

const authForm = document.getElementById('authForm');
const authFormTitle = document.getElementById('authFormTitle');
const register = document.getElementById('register');
const access = document.getElementById('access');

const accessAccount = document.querySelector('#access-account');
const userCurrent = ''; // Usuário atual
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
    url: "https://todolist-c7650.firebaseapp.com"
};

const resetPassword = document.querySelector('#passwordReset');
const btnResetPassword = document.querySelector('#passwordReset button');
const authOtherProviders = document.querySelectorAll('.authFirebase');
const userName = document.querySelector('#userName');
const userImg = document.querySelector('#userImg');

// Dados dos usuários
const nameUser = document.querySelector('.updateUser');
const deleteAccount = document.querySelector('#deleteUser');

// Outro módulo
const todoForm = document.querySelector('#todoForm');



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
            // const errorCode = err.code;
            // const errorMessage = err.message;
            // hideItem(loading);
            // alert("Failed login");
            // console.log(errorCode, errorMessage);
            showError('Falha no acesso: ', err);
        })
    } else {
        createUserWithEmailAndPassword(auth, authForm.email.value, authForm.password.value)
        // Esse .then e outros foram comentados pq o "onAuthStateChanged" já monitora nossas mudanças de estado de autenticação
        // Isso inclui criar uma conta, logar um usuário, logar por um provedor e etc, então com um .then de lá, já abordamos esses casos
        // Mas é plenamente possível receber e tratar as promises do obj auth sem esse método "onauthStateChanged", como mostrado abaixo;
        // .then((userCredential) => {
        //     const user = userCredential.user;
        //     alert(`Parabéns por se cadastrar ${user.email}`)
        //     console.log('Usuário cadastrado com sucesso');
        // })
        .catch((err) => showError('Falha no cadastro: ', err));
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
    .catch((err) => showError('Falha ao sair da conta: ', err));
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
    .catch((err) => showError('Falha ao enviar verificação de e-mail:', err))
    .finally(function () {
        hideItem(loading);
    })
    // console.log(`E-mail verificado? ${auth.currentUser.emailVerified}`);
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
    .catch((err) => showError('Falha ao tentar enviar link de redefinição de senha: ', err))
    .finally(() => {
        hideItem(loading);
    })
});

// Autenticação atráves de outros provedores (Google, Facebook, etc)
// OBS (Só pelo usuário logar pelo google, ele automaticamente já é autenticado após logar pelo seu e-mail)

authOtherProviders.forEach((auths) => {
    auths.addEventListener('click', (e) => {
        const providers = e.target;
        let whichProvider;
        let nameProvider = '';

        // console.log(providers);
        if(providers.id === 'auth-google'){
            whichProvider = new GoogleAuthProvider();
            nameProvider = "Google"
        }
        else if(providers.id === 'auth-github'){
            whichProvider = new GithubAuthProvider();
            nameProvider = "Github"
        } else if(providers.id === 'auth-facebook'){
            // Uma OBS é q a autenticação do Facebook só funciona cm um dominio cm certificado SSL (https)
            whichProvider = new FacebookAuthProvider();
            nameProvider = "Facebook"
        }

        showItem(loading);
        // console.log(whichProvider);
        // Redicirecionando para outra guia para o usuário confirmar a conta dele do google e logar
        signInWithPopup(auth, whichProvider)
        .catch((err) => showError(`Falha ao tentar logar com sua conta ${nameProvider}: `, err))
        // Poderiamos trocar o signInWithRedirect por signInWithPopup
    });
    // Fora do evento de clique
    
    // Autenticação usando google (default)
    // authOtherProviders.addEventListener('click', () => {
    //     const provider = new GoogleAuthProvider();
    //     showItem(loading);
    //     // Redicirecionando para outra guia para o usuário confirmar a conta dele do google e logar
    //     signInWithPopup(auth, provider)
    //     .catch((err) => {
    //         alert('Houve um erro ao autenticar com sua conta Google');
    //         console.log(err.message);
    //         hideItem(loading);
    //     });
    //     // Poderiamos trocar o signInWithRedirect por signInWithPopup
    // });
});

// Atualizando dados do usuário (name)
    // nameUser.addEventListener('click', updateUserName); pra funcionar assim a função tem que ser declarada antes de ser chamada
    nameUser.addEventListener('click', () => {
        const userCur = auth.currentUser;
        updateUserName(userCur);
    });

// Deletando contas de usuáriso

    deleteAccount.addEventListener('click', () => {
        let confirmation = confirm('Tem certeza que deseja excluir sua conta (Todos os dados e informações dessa conta serão perdidos)');

        if(confirmation) {
            const userCurrent = auth.currentUser;
            showItem(loading);
            userCurrent.delete()
            .then(() => alert('Conta foi removida com sucesso'))
            .catch((err) => showError('Falha ao tentar remover sua conta: ', err))
            .finally(() => hideItem(loading));
        };

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
    // Se a autenticação foi feita por um provedor confiável, não é preciso o usuário verificar o e-mail
    // esse !== (diferente) de password é pq qnd nós mesmos autenticamos o usuário, esse providerId tem o atributo "password"
    if(user.providerData[0].providerId != password){
        emailVerified.innerHTML = 'Autenticado por provedor confiável'
        hideItem(verificationEmail);

        if(user.emailVerified){
            emailVerified.innerHTML = 'E-MAIL VERIFICADO'
            hideItem(verificationEmail);
        } else {
            emailVerified.innerHTML = 'E-MAIL NÃO VERIFICADO'
            showItem(verificationEmail);
        };
    }

    // Adicionando dinamicamente informações públicas do perfil do google logado
    // console.log(user.photoURL);
    userImg.src = user.photoURL ? user.photoURL : 'uploads/unknownUser.png'
    userName.innerHTML = user.displayName; //User esse código é bem mais simples e eficiente do q o abaixo
    userEmail.innerHTML = `${user.email}`;

    // O code abaixo é pq no meu github n tinha o atributo displayName, mas tinha meu nick nesse screenName (OBS esse código é completamente descartável)
    // user.displayName ? userName.innerHTML = user.displayName : userName.innerHTML = user.reloadUserInfo.screenName;
    // if(typeof user.reloadUserInfo.screenName == "undefined") userName.innerHTML = ''; corrigindo o "bug" de ficar "undefined" qnd um usuário era logado sem ser por um provedor

    hideItem(authentication);
    showItem(userContent);
};
// Exibir para usuários NÃO autenticados;
const showAuth = () => {
    hideItem(userContent);
    showItem(authentication);
}

// Atualizando dados do usuário (name é só pra exemplificar)
const updateUserName = (user) => {
    let newUserName = prompt('Informe um novo nome de usuário', userName.innerHTML);
    
    if(newUserName && newUserName !== ''){
        userName.innerHTML = newUserName;
        showItem(loading);
        updateProfile(user, {
            displayName: newUserName
        })
        .catch((err) => {
            alert('Erro ao atualizar o nome de usuário')
            // console.log(err);
        })
        .finally(() => hideItem(loading));

    } else {
        alert('O nome de usuário não pode ficar em branco');
    }
};

// Centralizando erros
function showError(prefix, err){
    // console.log(err.code);
    hideItem(loading);

    switch (err.code) {
        // Se o meu email ou senha estiverem inválidas
        case 'auth/invalid-email':
        case 'auth/internal-error':
        case 'auth/wrong-password':
            alert(`${prefix} E-mail ou Senha inválida`)
            break;

        case 'auth/user-not-found':
            alert(`${prefix} Usuário não encontrado`)
            break;

        case 'auth/weak-password':
            alert(`${prefix} Senha deve ter ao menos 6 caracteres`)
            break;

        case 'auth/email-already-in-use':
            alert(`${prefix} Este e-mail já está em uso!`)
            break;

        case 'auth/popup-closed-by-user':
            alert(`${prefix} Você fechou a janela de popup antes da operação de login ser concluida!`);
            break;

    
        default: alert(`${prefix} ${err.message}`)
    };

};

// FIM DA AUTENTICAÇÃO

// RealTime Database




todoForm.onsubmit = (e) => {
    e.preventDefault();
    if(todoForm.name.value != ''){
    addTask(todoForm.name.value, auth.currentUser.uid);
    } else {
        alert('O campo da tarefa não pode estar em branco');
    }
}






