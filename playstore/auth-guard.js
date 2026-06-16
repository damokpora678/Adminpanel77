function initAuthGuard(callback) {
    firebase.auth().onAuthStateChanged(function(user) {
        if (!user) {
            window.location.href = 'admin.html';
            return;
        }
        firebase.database().ref('admins/' + user.uid).once('value').then(function(snap) {
            if (!snap.exists() || snap.val() !== true) {
                firebase.auth().signOut().then(function() {
                    window.location.href = 'admin.html';
                });
                return;
            }
            if (typeof callback === 'function') callback(user);
        });
    });
}
