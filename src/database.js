import { child, ref, set, push } from 'firebase/database';
import {auth, db, dbRef} from './index';

// const dbRef = ref(db, 'users');

const addTask = (task, userId) => {
    // sobreescreve task para o mesmo id
    // set(ref(db, 'users/' + userId), {
    //     teste: task
    // }).then(() => alert('foi')); 

    // Adiciona tasks para o mesmo id
    push(ref(db, 'users/' + auth.currentUser.uid), {
        test: task
    }).then(() => alert('foi'));

    // Adicionando task a um id "user" aleatorio
    // push(dbRef, {
    //     test: task
    // }). then(() => alert('task add' + task.name));
}

export { addTask };