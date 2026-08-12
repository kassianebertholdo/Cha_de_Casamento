const {
    createClient
} = window.supabase;


const db =
    createClient(
        SUPABASE_URL,
        SUPABASE_ANON_KEY
    );


const loginScreen =
    document.getElementById(
        "loginScreen"
    );


const dashboard =
    document.getElementById(
        "dashboard"
    );


const loginButton =
    document.getElementById(
        "loginButton"
    );


const logoutButton =
    document.getElementById(
        "logoutButton"
    );


const loginError =
    document.getElementById(
        "loginError"
    );


/* =====================================================
   LOGIN
===================================================== */

loginButton.addEventListener(
    "click",
    login
);


async function login() {

    const email =
        document
        .getElementById("email")
        .value
        .trim();


    const password =
        document
        .getElementById("password")
        .value;


    loginError.textContent =
        "";


    const {
        error
    } = await db.auth.signInWithPassword({

        email,

        password

    });


    if (error) {

        loginError.textContent =
            "E-mail ou senha incorretos.";

        return;

    }


    await checkAdmin();

}


/* =====================================================
   VERIFICAR ADMIN
===================================================== */

async function checkAdmin() {

    const {
        data: {
            user
        }
    } =
    await db.auth.getUser();


    if (!user) {

        showLogin();

        return;

    }


    const {
        data,
        error
    } = await db.rpc(
        "is_admin"
    );


    if (
        error ||
        data !== true
    ) {

        await db.auth.signOut();

        loginError.textContent =
            "Esta conta não possui acesso ao painel.";

        showLogin();

        return;

    }


    showDashboard();

    await loadDashboard();

}


/* =====================================================
   DASHBOARD
===================================================== */

function showDashboard() {

    loginScreen.classList.add(
        "hidden"
    );

    dashboard.classList.remove(
        "hidden"
    );

}


function showLogin() {

    dashboard.classList.add(
        "hidden"
    );

    loginScreen.classList.remove(
        "hidden"
    );

}


/* =====================================================
   CARREGAR DADOS
===================================================== */

async function loadDashboard() {

    const {
        data,
        error
    } = await db

        .from("reservations")

    .select(`
            id,
            gift_id,
            guest_name,
            created_at,
            gifts (
                name,
                category,
                icon
            )
        `)

    .order(
        "created_at", {
            ascending: false
        }
    );


    if (error) {

        console.error(error);

        return;

    }


    renderStats(data);

    renderReservations(data);

}


/* =====================================================
   ESTATÍSTICAS
===================================================== */

async function renderStats(
    reservations
) {

    const {
        count
    } = await db

        .from("gifts")

    .select(
        "*", {
            count: "exact",
            head: true
        }
    );


    const total =
        count || 0;


    const reserved =
        reservations.length;


    const available =
        total - reserved;


    document.getElementById(
        "stats"
    ).innerHTML = `

        <div class="stat">

            <span>
                🎁
            </span>

            <strong>
                ${total}
            </strong>

            <small>
                presentes
            </small>

        </div>


        <div class="stat">

            <span>
                💚
            </span>

            <strong>
                ${reserved}
            </strong>

            <small>
                reservados
            </small>

        </div>


        <div class="stat">

            <span>
                ♡
            </span>

            <strong>
                ${available}
            </strong>

            <small>
                disponíveis
            </small>

        </div>

    `;

}


/* =====================================================
   RESERVAS
===================================================== */

function renderReservations(
    reservations
) {

    const container =
        document.getElementById(
            "reservations"
        );


    container.innerHTML = "";


    if (!reservations.length) {

        container.innerHTML = `

            <div class="empty">

                <span>
                    ♡
                </span>

                <p>
                    Ainda não há presentes reservados.
                </p>

            </div>

        `;

        return;

    }


    reservations.forEach(
        reservation => {

            const gift =
                reservation.gifts;


            const date =
                new Date(
                    reservation.created_at
                ).toLocaleString(
                    "pt-BR"
                );


            const card =
                document.createElement(
                    "article"
                );


            card.className =
                "reservation";


            card.innerHTML = `

                <div class="reservation-icon">

                    ${
                        gift?.icon ||
                        "🎁"
                    }

                </div>


                <div class="reservation-info">

                    <span>
                        ${
                            gift?.category ||
                            ""
                        }
                    </span>

                    <h3>
                        ${
                            gift?.name ||
                            "Presente"
                        }
                    </h3>

                    <p>
                        Escolhido por:
                        <strong>
                            ${escapeHtml(
                                reservation.guest_name
                            )}
                        </strong>
                    </p>

                    <small>
                        ${date}
                    </small>

                </div>


                <button
                    class="delete-button"
                    data-id="${reservation.id}"
                >
                    Liberar
                </button>

            `;


            container.appendChild(
                card
            );

        }
    );


    document
        .querySelectorAll(
            ".delete-button"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () =>
                    deleteReservation(
                        Number(
                            button.dataset.id
                        )
                    )
                );

            }
        );

}


/* =====================================================
   EXCLUIR RESERVA
===================================================== */

async function deleteReservation(
    id
) {

    const confirmed =
        confirm(
            "Deseja realmente liberar este presente?"
        );


    if (!confirmed) {

        return;

    }


    const {
        error
    } = await db

        .from("reservations")

    .delete()

    .eq(
        "id",
        id
    );


    if (error) {

        alert(
            "Não foi possível liberar."
        );

        return;

    }


    await loadDashboard();

}


/* =====================================================
   LOGOUT
===================================================== */

logoutButton.addEventListener(
    "click",
    async() => {

        await db.auth.signOut();

        showLogin();

    }
);


/* =====================================================
   ATUALIZAR
===================================================== */

document
    .getElementById(
        "refreshButton"
    )
    .addEventListener(
        "click",
        loadDashboard
    );


/* =====================================================
   ESCAPAR HTML
===================================================== */

function escapeHtml(value) {

    return String(value)

    .replaceAll(
        "&",
        "&amp;"
    )

    .replaceAll(
        "<",
        "&lt;"
    )

    .replaceAll(
        ">",
        "&gt;"
    )

    .replaceAll(
        '"',
        "&quot;"
    )

    .replaceAll(
        "'",
        "&#039;"
    );

}


/* =====================================================
   INICIALIZAÇÃO
===================================================== */

checkAdmin();