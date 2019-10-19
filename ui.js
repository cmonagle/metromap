const HIDDEN = 'hidden';

const UI = {
    /**
     * @param {boolean} loading 
     */
    setLoading(loading) {
        const loader = document.querySelector('.loader')
        loader.classList[loading ? 'remove': 'add'](HIDDEN);

    },
    /**
     * 
     * @param {boolean} showForm 
     */
    setShowForm(showForm) {
        const form = document.querySelector('form');
        form.classList[showForm ? 'remove': 'add'](HIDDEN);
    }
}

export default UI;