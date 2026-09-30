
const SUPABASE_URL =
    "https://nnbvfxrvxgjpumrvjhyb.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_CcIbyoOUtw3S0xdhQyh0Og_DkhhyF2A";



const ADMIN_USER_ID =
    "cea7a536-4264-4c2f-b6f5-a03a51163e1c";


const IMAGE_BUCKET =
    "texture-images";

const FILE_BUCKET =
    "texture-files";



const supabaseClient =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_PUBLISHABLE_KEY
    );


const ITEMS_PER_PAGE = 18;

const SIGNED_URL_EXPIRES =
    600;


let textures = [];

let filteredTextures = [];

let currentPage = 1;

let selectedTexture = null;

let currentUser = null;

let isAdmin = false;



const textureGrid =
    document.getElementById("textureGrid");

const previousPage =
    document.getElementById("previousPage");

const nextPage =
    document.getElementById("nextPage");

const pageNumber =
    document.getElementById("pageNumber");

const searchInput =
    document.getElementById("searchInput");

const searchSubmit =
    document.getElementById("searchSubmit");

const postForm =
    document.getElementById("postForm");

const postSection =
    document.getElementById("postSection");

const postButton =
    document.getElementById("postButton");

const searchButton =
    document.getElementById("searchButton");

const exploreButton =
    document.getElementById("exploreButton");

const logoButton =
    document.getElementById("logoButton");

const textureSection =
    document.getElementById("textureSection");


const loginButton =
    document.getElementById("loginButton");

const loginStatus =
    document.getElementById("loginStatus");

const loginModal =
    document.getElementById("loginModal");

const closeLoginModal =
    document.getElementById("closeLoginModal");

const loginForm =
    document.getElementById("loginForm");

const loginEmail =
    document.getElementById("loginEmail");

const loginPassword =
    document.getElementById("loginPassword");

const loginMessage =
    document.getElementById("loginMessage");

const logoutButton =
    document.getElementById("logoutButton");

const headerLogoutButton =
    document.getElementById("headerLogoutButton");


const textureModal =
    document.getElementById("textureModal");

const closeTextureModal =
    document.getElementById(
        "closeTextureModal"
    );

const detailImage =
    document.getElementById("detailImage");

const detailName =
    document.getElementById("detailName");

const detailDescription =
    document.getElementById(
        "detailDescription"
    );

const detailVersion =
    document.getElementById(
        "detailVersion"
    );

const detailDownload =
    document.getElementById(
        "detailDownload"
    );



const adModal =
    document.getElementById("adModal");

const closeAd =
    document.getElementById("closeAd");

const downloadAfterAd =
    document.getElementById(
        "downloadAfterAd"
    );



const termsButton =
    document.getElementById("termsButton");

const termsModal =
    document.getElementById("termsModal");

const closeTermsModal =
    document.getElementById(
        "closeTermsModal"
    );



const privacyButton =
    document.getElementById("privacyButton");

const privacyModal =
    document.getElementById("privacyModal");

const closePrivacyModal =
    document.getElementById(
        "closePrivacyModal"
    );



function elementExists(element) {

    return element !== null;

}



function escapeHTML(text) {

    const div =
        document.createElement("div");

    div.textContent =
        String(text ?? "");

    return div.innerHTML;

}



async function initializeApp() {

    console.log(
        "Rain Texture starting..."
    );


    if (
        !SUPABASE_PUBLISHABLE_KEY ||
        SUPABASE_PUBLISHABLE_KEY ===
        "ここにあなたのsb_publishableキー"
    ) {

        console.error(
            "Supabase Publishable Keyが設定されていません。"
        );

        if (
            elementExists(loginStatus)
        ) {

            loginStatus.textContent =
                "Supabaseキーが設定されていません。";

        }

        return;

    }


    await checkCurrentUser();

    await loadTextures();


    supabaseClient.auth.onAuthStateChange(
        function (
            event,
            session
        ) {

            console.log(
                "Auth event:",
                event
            );


            currentUser =
                session?.user ?? null;


            updateAdminState();




            setTimeout(
                function () {

                    loadTextures();

                },
                0
            );

        }
    );

}


async function checkCurrentUser() {

    try {

        const {
            data,
            error
        } =
            await supabaseClient.auth.getUser();


        if (error) {

            currentUser =
                null;

        } else {

            currentUser =
                data?.user ?? null;

        }


        updateAdminState();

    } catch (error) {

        console.error(
            "ユーザー確認エラー:",
            error
        );

        currentUser =
            null;

        updateAdminState();

    }

}


function updateAdminState() {

    isAdmin =
        !!currentUser &&
        currentUser.id ===
        ADMIN_USER_ID;


    console.log(
        "Current user:",
        currentUser?.id ?? "none"
    );

    console.log(
        "Admin:",
        isAdmin
    );


    if (
        elementExists(postForm)
    ) {

        postForm.style.display =
            isAdmin
                ? "block"
                : "none";

    }

    if (
        elementExists(loginStatus)
    ) {

        loginStatus.textContent =
            isAdmin
                ? "ADMINISTRATOR — ログイン中"
                : "管理者専用エリア";

    }



    if (
        elementExists(loginButton)
    ) {

        loginButton.style.display =
            isAdmin
                ? "none"
                : "";

    }



    if (
        elementExists(headerLogoutButton)
    ) {

        headerLogoutButton.style.display =
            isAdmin
                ? ""
                : "none";

    }



    if (
        elementExists(logoutButton)
    ) {

        logoutButton.style.display =
            isAdmin
                ? "block"
                : "none";

    }


    if (
        textures.length > 0
    ) {

        renderTextures();

    }

}

async function loadTextures() {

    if (
        !elementExists(textureGrid)
    ) {

        return;

    }


    textureGrid.innerHTML = `

        <div class="no-results">

            <strong>
                Loading textures...
            </strong>

            <span>
                テクスチャを読み込んでいます。
            </span>

        </div>

    `;


    try {

        const {
            data,
            error
        } =
            await supabaseClient
                .from("textures")
                .select("*")
                .order(
                    "created_at",
                    {
                        ascending: false
                    }
                );


        if (error) {

            console.error(
                "Texture loading error:",
                error
            );


            textureGrid.innerHTML = `

                <div class="no-results">

                    <strong>
                        テクスチャを読み込めませんでした
                    </strong>

                    <span>
                        SupabaseのDatabase設定を確認してください。
                    </span>

                </div>

            `;

            return;

        }


        textures =
            Array.isArray(data)
                ? data
                : [];


        filteredTextures =
            [...textures];




        const totalPages =
            Math.max(
                1,
                Math.ceil(
                    filteredTextures.length /
                    ITEMS_PER_PAGE
                )
            );


        if (
            currentPage > totalPages
        ) {

            currentPage =
                totalPages;

        }


        renderTextures();

    } catch (error) {

        console.error(
            "Unexpected loading error:",
            error
        );


        textureGrid.innerHTML = `

            <div class="no-results">

                <strong>
                    エラーが発生しました
                </strong>

                <span>
                    ブラウザのコンソールを確認してください。
                </span>

            </div>

        `;

    }

}


function renderTextures() {

    if (
        !elementExists(textureGrid)
    ) {

        return;

    }


    textureGrid.innerHTML = "";


    if (
        filteredTextures.length === 0
    ) {

        textureGrid.innerHTML = `

            <div class="no-results">

                <strong>
                    テクスチャが見つかりません
                </strong>

                <span>
                    別の名前で検索してみてください。
                </span>

            </div>

        `;


        updatePagination();

        return;

    }


    const start =
        (currentPage - 1) *
        ITEMS_PER_PAGE;


    const end =
        start +
        ITEMS_PER_PAGE;


    const pageTextures =
        filteredTextures.slice(
            start,
            end
        );


    pageTextures.forEach(
        function (
            texture,
            index
        ) {

            const card =
                document.createElement(
                    "article"
                );


            card.className =
                "texture-card";


            card.style.animationDelay =
                `${index * 0.04}s`;


            const imageURL =
                texture.image_url ||
                "";




            const adminButtons =
                isAdmin
                    ? `

                        <div
                            class="admin-texture-actions"
                            style="
                                display:flex;
                                gap:8px;
                                margin-top:10px;
                            "
                        >

                            <button
                                type="button"
                                class="texture-edit-button"
                                data-texture-id="${escapeHTML(texture.id)}"
                            >
                                EDIT
                            </button>

                            <button
                                type="button"
                                class="texture-delete-button"
                                data-texture-id="${escapeHTML(texture.id)}"
                            >
                                DELETE
                            </button>

                        </div>

                    `
                    : "";


            card.innerHTML = `

                <img
                    class="texture-image"
                    src="${escapeHTML(imageURL)}"
                    alt="${escapeHTML(texture.name)}"
                    loading="lazy"
                >


                <div class="texture-info">

                    <h3 class="texture-name">
                        ${escapeHTML(texture.name)}
                    </h3>


                    <p class="texture-description">
                        ${escapeHTML(texture.description)}
                    </p>


                    <span class="texture-version">
                        VERSION ${escapeHTML(texture.version)}
                    </span>


                    <button
                        class="download-button"
                        type="button"
                    >
                        DOWNLOAD
                    </button>


                    ${adminButtons}

                </div>

            `;



            card.addEventListener(
                "click",
                function (event) {

                    if (
                        event.target.closest(
                            ".download-button"
                        )
                    ) {

                        return;

                    }


                    if (
                        event.target.closest(
                            ".texture-edit-button"
                        )
                    ) {

                        return;

                    }


                    if (
                        event.target.closest(
                            ".texture-delete-button"
                        )
                    ) {

                        return;

                    }


                    openTextureDetails(
                        texture
                    );

                }
            );



            const downloadButton =
                card.querySelector(
                    ".download-button"
                );


            if (
                downloadButton
            ) {

                downloadButton.addEventListener(
                    "click",
                    function (event) {

                        event.stopPropagation();


                        openTextureDetails(
                            texture
                        );

                    }
                );

            }



            const editButton =
                card.querySelector(
                    ".texture-edit-button"
                );


            if (
                editButton
            ) {

                editButton.addEventListener(
                    "click",
                    function (event) {

                        event.stopPropagation();


                        if (!isAdmin) {

                            return;

                        }


                        openEditModal(
                            texture
                        );

                    }
                );

            }



            const deleteButton =
                card.querySelector(
                    ".texture-delete-button"
                );


            if (
                deleteButton
            ) {

                deleteButton.addEventListener(
                    "click",
                    async function (event) {

                        event.stopPropagation();


                        if (!isAdmin) {

                            return;

                        }


                        await deleteTexture(
                            texture
                        );

                    }
                );

            }


            textureGrid.appendChild(
                card
            );

        }
    );


    updatePagination();

}



function openTextureDetails(
    texture
) {

    selectedTexture =
        texture;


    if (
        elementExists(detailImage)
    ) {

        detailImage.src =
            texture.image_url || "";

        detailImage.alt =
            texture.name || "";

    }


    if (
        elementExists(detailName)
    ) {

        detailName.textContent =
            texture.name || "";

    }


    if (
        elementExists(detailDescription)
    ) {

        detailDescription.textContent =
            texture.description || "";

    }


    if (
        elementExists(detailVersion)
    ) {

        detailVersion.textContent =
            `VERSION ${texture.version || ""}`;

    }


    if (
        elementExists(textureModal)
    ) {

        textureModal.classList.add(
            "active"
        );


        document.body.style.overflow =
            "hidden";

    }

}



function closeTextureDetails() {

    if (
        elementExists(textureModal)
    ) {

        textureModal.classList.remove(
            "active"
        );

    }


    document.body.style.overflow =
        "";

}




if (
    elementExists(closeTextureModal)
) {

    closeTextureModal.addEventListener(
        "click",
        closeTextureDetails
    );

}



if (
    elementExists(textureModal)
) {

    textureModal.addEventListener(
        "click",
        function (event) {

            if (
                event.target ===
                textureModal
            ) {

                closeTextureDetails();

            }

        }
    );

}




function openTermsModal() {

    if (
        elementExists(termsModal)
    ) {

        termsModal.classList.add(
            "active"
        );


        document.body.style.overflow =
            "hidden";

    }

}



function closeTermsModalFunction() {

    if (
        elementExists(termsModal)
    ) {

        termsModal.classList.remove(
            "active"
        );

    }


    document.body.style.overflow =
        "";

}



if (
    elementExists(termsButton)
) {

    termsButton.addEventListener(
        "click",
        openTermsModal
    );

}



if (
    elementExists(closeTermsModal)
) {

    closeTermsModal.addEventListener(
        "click",
        closeTermsModalFunction
    );

}



if (
    elementExists(termsModal)
) {

    termsModal.addEventListener(
        "click",
        function (event) {

            if (
                event.target ===
                termsModal
            ) {

                closeTermsModalFunction();

            }

        }
    );

}




function openPrivacyModal() {

    if (
        elementExists(privacyModal)
    ) {

        privacyModal.classList.add(
            "active"
        );


        document.body.style.overflow =
            "hidden";

    }

}



function closePrivacyModalFunction() {

    if (
        elementExists(privacyModal)
    ) {

        privacyModal.classList.remove(
            "active"
        );

    }


    document.body.style.overflow =
        "";

}



if (
    elementExists(privacyButton)
) {

    privacyButton.addEventListener(
        "click",
        openPrivacyModal
    );

}



if (
    elementExists(closePrivacyModal)
) {

    closePrivacyModal.addEventListener(
        "click",
        closePrivacyModalFunction
    );

}



if (
    elementExists(privacyModal)
) {

    privacyModal.addEventListener(
        "click",
        function (event) {

            if (
                event.target ===
                privacyModal
            ) {

                closePrivacyModalFunction();

            }

        }
    );

}




if (
    elementExists(detailDownload)
) {

    detailDownload.addEventListener(
        "click",
        function () {

            if (
                !selectedTexture
            ) {

                return;

            }


            openAd(
                selectedTexture
            );

        }
    );

}



function updatePagination() {

    if (
        !elementExists(pageNumber) ||
        !elementExists(previousPage) ||
        !elementExists(nextPage)
    ) {

        return;

    }


    const totalPages =
        Math.max(
            1,
            Math.ceil(
                filteredTextures.length /
                ITEMS_PER_PAGE
            )
        );


    pageNumber.textContent =
        `${currentPage} / ${totalPages}`;


    previousPage.disabled =
        currentPage <= 1;


    nextPage.disabled =
        currentPage >= totalPages;

}



if (
    elementExists(previousPage)
) {

    previousPage.addEventListener(
        "click",
        function () {

            if (
                currentPage > 1
            ) {

                currentPage--;

                renderTextures();

                scrollToTextures();

            }

        }
    );

}


if (
    elementExists(nextPage)
) {

    nextPage.addEventListener(
        "click",
        function () {

            const totalPages =
                Math.max(
                    1,
                    Math.ceil(
                        filteredTextures.length /
                        ITEMS_PER_PAGE
                    )
                );


            if (
                currentPage <
                totalPages
            ) {

                currentPage++;

                renderTextures();

                scrollToTextures();

            }

        }
    );

}



function performSearch() {

    if (
        !elementExists(searchInput)
    ) {

        return;

    }


    const keyword =
        searchInput.value
            .trim()
            .toLowerCase();


    if (
        keyword === ""
    ) {

        filteredTextures =
            [...textures];

    } else {

        filteredTextures =
            textures.filter(
                function (texture) {

                    const name =
                        String(
                            texture.name || ""
                        ).toLowerCase();


                    const description =
                        String(
                            texture.description || ""
                        ).toLowerCase();


                    const version =
                        String(
                            texture.version || ""
                        ).toLowerCase();


                    return (
                        name.includes(keyword) ||
                        description.includes(keyword) ||
                        version.includes(keyword)
                    );

                }
            );

    }


    currentPage =
        1;


    renderTextures();

    scrollToTextures();

}



if (
    elementExists(searchSubmit)
) {

    searchSubmit.addEventListener(
        "click",
        performSearch
    );

}



if (
    elementExists(searchInput)
) {

    searchInput.addEventListener(
        "keydown",
        function (event) {

            if (
                event.key === "Enter"
            ) {

                event.preventDefault();

                performSearch();

            }

        }
    );

}



if (
    elementExists(loginButton)
) {

    loginButton.addEventListener(
        "click",
        function () {

            if (isAdmin) {

                return;

            }


            openLoginModal();

        }
    );

}




if (
    elementExists(headerLogoutButton)
) {

    headerLogoutButton.addEventListener(
        "click",
        async function () {

            await logoutAdmin();

        }
    );

}



if (
    elementExists(postButton)
) {

    postButton.addEventListener(
        "click",
        function () {

            if (isAdmin) {

                if (
                    elementExists(postSection)
                ) {

                    postSection.scrollIntoView({
                        behavior: "smooth"
                    });

                }

                return;

            }


            openLoginModal();

        }
    );

}


if (
    elementExists(searchButton)
) {

    searchButton.addEventListener(
        "click",
        function () {

            if (
                elementExists(textureSection)
            ) {

                textureSection.scrollIntoView({
                    behavior: "smooth"
                });

            }


            setTimeout(
                function () {

                    if (
                        elementExists(searchInput)
                    ) {

                        searchInput.focus();

                    }

                },
                500
            );

        }
    );

}


if (
    elementExists(logoButton)
) {

    logoButton.addEventListener(
        "click",
        function () {

            window.scrollTo({
                top: 0,
                behavior: "smooth"
            });

        }
    );

}



if (
    elementExists(exploreButton)
) {

    exploreButton.addEventListener(
        "click",
        function () {

            if (
                elementExists(textureSection)
            ) {

                textureSection.scrollIntoView({
                    behavior: "smooth"
                });

            }

        }
    );

}



function openLoginModal() {

    if (
        !elementExists(loginModal)
    ) {

        return;

    }


    if (
        elementExists(loginMessage)
    ) {

        loginMessage.textContent =
            "";

    }


    loginModal.classList.add(
        "active"
    );


    document.body.style.overflow =
        "hidden";


    if (
        elementExists(loginEmail)
    ) {

        loginEmail.focus();

    }

}



function closeLoginModalFunction() {

    if (
        elementExists(loginModal)
    ) {

        loginModal.classList.remove(
            "active"
        );

    }


    document.body.style.overflow =
        "";

}


if (
    elementExists(closeLoginModal)
) {

    closeLoginModal.addEventListener(
        "click",
        closeLoginModalFunction
    );

}



if (
    elementExists(loginModal)
) {

    loginModal.addEventListener(
        "click",
        function (event) {

            if (
                event.target ===
                loginModal
            ) {

                closeLoginModalFunction();

            }

        }
    );

}



if (
    elementExists(loginForm)
) {

    loginForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            const email =
                loginEmail.value.trim();


            const password =
                loginPassword.value;


            if (
                !email ||
                !password
            ) {

                if (
                    elementExists(loginMessage)
                ) {

                    loginMessage.textContent =
                        "メールアドレスとパスワードを入力してください。";

                }

                return;

            }


            if (
                elementExists(loginMessage)
            ) {

                loginMessage.textContent =
                    "ログインしています...";

            }


            try {

                const {
                    data,
                    error
                } =
                    await supabaseClient.auth
                        .signInWithPassword({
                            email:
                                email,

                            password:
                                password
                        });


                if (error) {

                    console.error(
                        "Login error:",
                        error
                    );


                    if (
                        elementExists(
                            loginMessage
                        )
                    ) {

                        loginMessage.textContent =
                            "ログインできませんでした。メールアドレス・パスワードを確認してください。";

                    }

                    return;

                }


                const user =
                    data?.user;


                if (
                    !user
                ) {

                    if (
                        elementExists(
                            loginMessage
                        )
                    ) {

                        loginMessage.textContent =
                            "ユーザー情報を取得できませんでした。";

                    }

                    return;

                }



                if (
                    user.id !==
                    ADMIN_USER_ID
                ) {

                    await supabaseClient.auth.signOut();


                    if (
                        elementExists(
                            loginMessage
                        )
                    ) {

                        loginMessage.textContent =
                            "このアカウントはRain Textureの管理者ではありません。";

                    }

                    return;

                }


                currentUser =
                    user;


                updateAdminState();


                if (
                    elementExists(
                        loginMessage
                    )
                ) {

                    loginMessage.textContent =
                        "管理者としてログインしました！";

                }


                setTimeout(
                    function () {

                        closeLoginModalFunction();

                    },
                    700
                );

            } catch (error) {

                console.error(
                    "Unexpected login error:",
                    error
                );


                if (
                    elementExists(
                        loginMessage
                    )
                ) {

                    loginMessage.textContent =
                        "ログイン中にエラーが発生しました。";

                }

            }

        }
    );

}



async function logoutAdmin() {

    try {

        const {
            error
        } =
            await supabaseClient.auth.signOut();


        if (error) {

            throw error;

        }


        currentUser =
            null;


        isAdmin =
            false;


        updateAdminState();


        alert(
            "ログアウトしました。"
        );


        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });


    } catch (error) {

        console.error(
            "Logout error:",
            error
        );


        alert(
            "ログアウトに失敗しました。"
        );

    }

}


if (
    elementExists(logoutButton)
) {

    logoutButton.addEventListener(
        "click",
        async function () {

            await logoutAdmin();

        }
    );

}



if (
    elementExists(postForm)
) {

    postForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            if (!isAdmin) {

                alert(
                    "管理者のみ投稿できます。"
                );

                return;

            }


            const {
                data:
                userData,
                error:
                userError
            } =
                await supabaseClient.auth.getUser();


            const user =
                userData?.user;


            if (
                userError ||
                !user ||
                user.id !== ADMIN_USER_ID
            ) {

                alert(
                    "管理者としてログインしてください。"
                );

                return;

            }


            const nameInput =
                document.getElementById(
                    "textureName"
                );


            const descriptionInput =
                document.getElementById(
                    "textureDescription"
                );


            const versionInput =
                document.getElementById(
                    "textureVersion"
                );


            const imageInput =
                document.getElementById(
                    "textureImage"
                );


            const fileInput =
                document.getElementById(
                    "textureFile"
                );


            if (
                !nameInput ||
                !descriptionInput ||
                !versionInput ||
                !imageInput ||
                !fileInput
            ) {

                alert(
                    "投稿フォームの設定を確認してください。"
                );

                return;

            }


            const name =
                nameInput.value.trim();


            const description =
                descriptionInput.value.trim();


            const version =
                versionInput.value.trim();


            if (!name) {

                alert(
                    "テクスチャ名を入力してください。"
                );

                nameInput.focus();

                return;

            }


            if (!version) {

                alert(
                    "バージョンを入力してください。"
                );

                versionInput.focus();

                return;

            }


            if (
                imageInput.files.length === 0
            ) {

                alert(
                    "プレビュー画像を選択してください。"
                );

                return;

            }


            if (
                fileInput.files.length === 0
            ) {

                alert(
                    "テクスチャファイルを選択してください。"
                );

                return;

            }


            const imageFile =
                imageInput.files[0];


            const textureFile =
                fileInput.files[0];


            const safeName =
                sanitizeFileName(
                    name
                );


            const uniqueID =
                `${Date.now()}-${Math.random()
                    .toString(36)
                    .substring(2, 9)}`;


            const imageExtension =
                getFileExtension(
                    imageFile.name
                );


            const textureExtension =
                getFileExtension(
                    textureFile.name
                );


            const imagePath =
                `${safeName}-${uniqueID}.${imageExtension}`;


            const filePath =
                `${safeName}-${uniqueID}.${textureExtension}`;


            const submitButton =
                postForm.querySelector(
                    ".submit-button"
                );


            if (submitButton) {

                submitButton.disabled =
                    true;

                submitButton.textContent =
                    "UPLOADING...";

            }


            let imageUploaded =
                false;

            let fileUploaded =
                false;


            try {


                const {
                    error:
                    imageError
                } =
                    await supabaseClient.storage
                        .from(IMAGE_BUCKET)
                        .upload(
                            imagePath,
                            imageFile,
                            {
                                cacheControl:
                                    "3600",

                                upsert:
                                    false,

                                contentType:
                                    imageFile.type
                            }
                        );


                if (imageError) {

                    throw new Error(
                        "画像のアップロードに失敗しました: " +
                        imageError.message
                    );

                }


                imageUploaded =
                    true;




                const {
                    error:
                    fileError
                } =
                    await supabaseClient.storage
                        .from(FILE_BUCKET)
                        .upload(
                            filePath,
                            textureFile,
                            {
                                cacheControl:
                                    "3600",

                                upsert:
                                    false,

                                contentType:
                                    textureFile.type ||
                                    "application/octet-stream"
                            }
                        );


                if (fileError) {

                    throw new Error(
                        "テクスチャファイルのアップロードに失敗しました: " +
                        fileError.message
                    );

                }


                fileUploaded =
                    true;



                const {
                    data:
                    imagePublicData
                } =
                    supabaseClient.storage
                        .from(IMAGE_BUCKET)
                        .getPublicUrl(
                            imagePath
                        );


                const imageURL =
                    imagePublicData?.publicUrl ||
                    "";


                if (!imageURL) {

                    throw new Error(
                        "画像URLを取得できませんでした。"
                    );

                }


                const {
                    data:
                    insertedData,
                    error:
                    databaseError
                } =
                    await supabaseClient
                        .from("textures")
                        .insert([
                            {
                                name:
                                    name,

                                description:
                                    description,

                                version:
                                    version,

                                image_url:
                                    imageURL,

                                file_url:
                                    filePath
                            }
                        ])
                        .select()
                        .single();


                if (databaseError) {

                    throw new Error(
                        "Databaseへの保存に失敗しました: " +
                        databaseError.message
                    );

                }


                console.log(
                    "投稿成功:",
                    insertedData
                );


                postForm.reset();


                await loadTextures();


                if (
                    elementExists(
                        textureSection
                    )
                ) {

                    textureSection.scrollIntoView({
                        behavior:
                            "smooth"
                    });

                }


                alert(
                    "テクスチャを投稿しました！"
                );

            } catch (error) {

                console.error(
                    "投稿エラー:",
                    error
                );


                if (imageUploaded) {

                    await supabaseClient.storage
                        .from(IMAGE_BUCKET)
                        .remove([
                            imagePath
                        ]);

                }


                if (fileUploaded) {

                    await supabaseClient.storage
                        .from(FILE_BUCKET)
                        .remove([
                            filePath
                        ]);

                }


                alert(
                    error.message ||
                    "テクスチャの投稿に失敗しました。"
                );

            } finally {

                if (submitButton) {

                    submitButton.disabled =
                        false;

                    submitButton.textContent =
                        "POST TEXTURE";

                }

            }

        }
    );

}



function sanitizeFileName(
    fileName
) {

    return String(fileName)
        .trim()
        .replace(
            /[\\/:*?"<>|]/g,
            "_"
        )
        .replace(
            /\s+/g,
            "_"
        )
        .substring(
            0,
            80
        );

}



function getFileExtension(
    fileName
) {

    const parts =
        String(fileName)
            .split(".");


    if (
        parts.length < 2
    ) {

        return "bin";

    }


    return parts
        .pop()
        .toLowerCase()
        .replace(
            /[^a-z0-9]/g,
            ""
        ) || "bin";

}



function openAd(
    texture
) {

    selectedTexture =
        texture;


    closeTextureDetails();


    if (
        elementExists(adModal)
    ) {

        adModal.classList.add(
            "active"
        );


        document.body.style.overflow =
            "hidden";

    }


    performDownload(
        texture,
        downloadAfterAd
    );

}



function closeAdModal() {

    if (
        elementExists(adModal)
    ) {

        adModal.classList.remove(
            "active"
        );

    }


    document.body.style.overflow =
        "";

}



if (
    elementExists(closeAd)
) {

    closeAd.addEventListener(
        "click",
        closeAdModal
    );

}


if (
    elementExists(adModal)
) {

    adModal.addEventListener(
        "click",
        function (event) {

            if (
                event.target ===
                adModal
            ) {

                closeAdModal();

            }

        }
    );

}

async function getPrivateDownloadURL(
    texture
) {

    if (
        !texture
    ) {

        throw new Error(
            "テクスチャが選択されていません。"
        );

    }


    let filePath =
        texture.file_url || "";


    if (!filePath) {

        throw new Error(
            "ダウンロードファイルが登録されていません。"
        );

    }



    if (
        filePath.startsWith("http://") ||
        filePath.startsWith("https://")
    ) {

        try {

            const parsedURL =
                new URL(filePath);


            const marker =
                `/storage/v1/object/public/${FILE_BUCKET}/`;


            const markerIndex =
                parsedURL.pathname.indexOf(
                    marker
                );


            if (
                markerIndex !== -1
            ) {

                filePath =
                    decodeURIComponent(
                        parsedURL.pathname.substring(
                            markerIndex +
                            marker.length
                        )
                    );

            }

        } catch {



        }

    }


    console.log(
        "Creating signed URL for:",
        filePath
    );


    const {
        data,
        error
    } =
        await supabaseClient.storage
            .from(FILE_BUCKET)
            .createSignedUrl(
                filePath,
                SIGNED_URL_EXPIRES,
                {
                    download:
                        getDownloadFileName(
                            texture
                        )
                }
            );


    if (error) {

        console.error(
            "Signed URL error:",
            error
        );


        throw new Error(
            "ダウンロードURLを作成できませんでした: " +
            error.message
        );

    }


    const signedURL =
        data?.signedUrl;


    if (!signedURL) {

        throw new Error(
            "ダウンロードURLを取得できませんでした。"
        );

    }


    return signedURL;

}


async function performDownload(
    texture,
    button
) {

    if (
        !texture
    ) {

        return;

    }


    if (
        button
    ) {

        button.disabled =
            true;


        button.textContent =
            "PREPARING DOWNLOAD...";

    }


    try {

        const signedURL =
            await getPrivateDownloadURL(
                texture
            );


        const link =
            document.createElement(
                "a"
            );


        link.href =
            signedURL;


        link.download =
            getDownloadFileName(
                texture
            );


        link.target =
            "_blank";


        link.rel =
            "noopener";


        document.body.appendChild(
            link
        );


        link.click();


        link.remove();


        if (
            button
        ) {

            button.textContent =
                "DOWNLOAD AGAIN";

        }

    } catch (error) {

        console.error(
            "Download error:",
            error
        );


        alert(
            error.message ||
            "ダウンロードに失敗しました。"
        );


        if (
            button
        ) {

            button.textContent =
                "DOWNLOAD TEXTURE";

        }

    } finally {

        if (
            button
        ) {

            button.disabled =
                false;

        }

    }

}



if (
    elementExists(downloadAfterAd)
) {

    downloadAfterAd.addEventListener(
        "click",
        function () {

            if (
                !selectedTexture
            ) {

                alert(
                    "テクスチャが選択されていません。"
                );

                return;

            }


            performDownload(
                selectedTexture,
                downloadAfterAd
            );

        }
    );

}


function getDownloadFileName(
    texture
) {

    const name =
        sanitizeFileName(
            texture.name ||
            "texture"
        );


    const path =
        String(
            texture.file_url ||
            ""
        );


    try {

        let pathname =
            path;


        if (
            path.startsWith("http://") ||
            path.startsWith("https://")
        ) {

            pathname =
                new URL(
                    path
                ).pathname;

        }


        const lastPart =
            decodeURIComponent(
                pathname
                    .split("/")
                    .pop()
            );


        const extension =
            getFileExtension(
                lastPart
            );


        return `${name}.${extension}`;

    } catch {

        return `${name}.zip`;

    }

}


function createEditModal() {

    if (
        document.getElementById(
            "editTextureModal"
        )
    ) {

        return document.getElementById(
            "editTextureModal"
        );

    }


    const modal =
        document.createElement("div");


    modal.id =
        "editTextureModal";


    modal.className =
        "ad-modal";


    modal.innerHTML = `

        <div class="ad-box">

            <button
                class="close-ad"
                id="closeEditTextureModal"
                type="button"
                aria-label="閉じる"
            >
                ×
            </button>


            <div class="ad-label">
                ADMIN EDIT
            </div>


            <h2>
                EDIT TEXTURE
            </h2>


            <form id="editTextureForm">


                <div class="form-group">

                    <label for="editTextureName">
                        テクスチャ名
                    </label>

                    <input
                        id="editTextureName"
                        type="text"
                        required
                    >

                </div>


                <div class="form-group">

                    <label for="editTextureDescription">
                        説明
                    </label>

                    <textarea
                        id="editTextureDescription"
                    ></textarea>

                </div>


                <div class="form-group">

                    <label for="editTextureVersion">
                        バージョン
                    </label>

                    <input
                        id="editTextureVersion"
                        type="text"
                        required
                    >

                </div>


                <div class="form-group">

                    <label for="editTextureImage">
                        新しいプレビュー画像
                    </label>

                    <input
                        id="editTextureImage"
                        type="file"
                        accept="image/*"
                    >

                </div>


                <div class="form-group">

                    <label for="editTextureFile">
                        新しいテクスチャファイル
                    </label>

                    <input
                        id="editTextureFile"
                        type="file"
                        accept=".mcpack,.zip,.mcaddon"
                    >

                </div>


                <button
                    class="submit-button"
                    id="editTextureSubmit"
                    type="submit"
                >
                    SAVE CHANGES
                </button>


                <p
                    id="editTextureMessage"
                    class="ad-text"
                ></p>


            </form>

        </div>

    `;


    document.body.appendChild(
        modal
    );


    const closeButton =
        document.getElementById(
            "closeEditTextureModal"
        );


    closeButton.addEventListener(
        "click",
        closeEditModal
    );


    modal.addEventListener(
        "click",
        function (event) {

            if (
                event.target ===
                modal
            ) {

                closeEditModal();

            }

        }
    );


    const form =
        document.getElementById(
            "editTextureForm"
        );


    form.addEventListener(
        "submit",
        submitEditTexture
    );


    return modal;

}


function openEditModal(
    texture
) {

    if (!isAdmin) {

        alert(
            "管理者のみ編集できます。"
        );

        return;

    }


    selectedTexture =
        texture;


    const modal =
        createEditModal();


    document.getElementById(
        "editTextureName"
    ).value =
        texture.name || "";


    document.getElementById(
        "editTextureDescription"
    ).value =
        texture.description || "";


    document.getElementById(
        "editTextureVersion"
    ).value =
        texture.version || "";


    document.getElementById(
        "editTextureImage"
    ).value =
        "";


    document.getElementById(
        "editTextureFile"
    ).value =
        "";


    document.getElementById(
        "editTextureMessage"
    ).textContent =
        "";


    modal.classList.add(
        "active"
    );


    document.body.style.overflow =
        "hidden";

}


function closeEditModal() {

    const modal =
        document.getElementById(
            "editTextureModal"
        );


    if (
        modal
    ) {

        modal.classList.remove(
            "active"
        );

    }


    document.body.style.overflow =
        "";

}


async function submitEditTexture(
    event
) {

    event.preventDefault();


    if (!isAdmin) {

        alert(
            "管理者のみ編集できます。"
        );

        return;

    }


    if (
        !selectedTexture
    ) {

        alert(
            "編集するテクスチャが選択されていません。"
        );

        return;

    }


    const name =
        document.getElementById(
            "editTextureName"
        ).value.trim();


    const description =
        document.getElementById(
            "editTextureDescription"
        ).value.trim();


    const version =
        document.getElementById(
            "editTextureVersion"
        ).value.trim();


    const imageInput =
        document.getElementById(
            "editTextureImage"
        );


    const fileInput =
        document.getElementById(
            "editTextureFile"
        );


    const submitButton =
        document.getElementById(
            "editTextureSubmit"
        );


    const message =
        document.getElementById(
            "editTextureMessage"
        );


    if (!name) {

        message.textContent =
            "テクスチャ名を入力してください。";

        return;

    }


    if (!version) {

        message.textContent =
            "バージョンを入力してください。";

        return;

    }


    submitButton.disabled =
        true;


    submitButton.textContent =
        "SAVING...";


    message.textContent =
        "保存しています...";


    const oldImageURL =
        selectedTexture.image_url || "";


    const oldFilePath =
        selectedTexture.file_url || "";


    let newImagePath =
        null;


    let newFilePath =
        null;


    try {

        const {
            data:
            userData,
            error:
            userError
        } =
            await supabaseClient.auth.getUser();


        const user =
            userData?.user;


        if (
            userError ||
            !user ||
            user.id !== ADMIN_USER_ID
        ) {

            throw new Error(
                "管理者としてログインしてください。"
            );

        }



        if (
            imageInput.files.length > 0
        ) {

            const imageFile =
                imageInput.files[0];


            const safeName =
                sanitizeFileName(
                    name
                );


            const uniqueID =
                `${Date.now()}-${Math.random()
                    .toString(36)
                    .substring(2, 9)}`;


            const extension =
                getFileExtension(
                    imageFile.name
                );


            newImagePath =
                `${safeName}-${uniqueID}.${extension}`;


            const {
                error:
                imageError
            } =
                await supabaseClient.storage
                    .from(IMAGE_BUCKET)
                    .upload(
                        newImagePath,
                        imageFile,
                        {
                            cacheControl:
                                "3600",

                            upsert:
                                false,

                            contentType:
                                imageFile.type
                        }
                    );


            if (imageError) {

                throw new Error(
                    "新しい画像のアップロードに失敗しました: " +
                    imageError.message
                );

            }

        }




        if (
            fileInput.files.length > 0
        ) {

            const textureFile =
                fileInput.files[0];


            const safeName =
                sanitizeFileName(
                    name
                );


            const uniqueID =
                `${Date.now()}-${Math.random()
                    .toString(36)
                    .substring(2, 9)}`;


            const extension =
                getFileExtension(
                    textureFile.name
                );


            newFilePath =
                `${safeName}-${uniqueID}.${extension}`;


            const {
                error:
                fileError
            } =
                await supabaseClient.storage
                    .from(FILE_BUCKET)
                    .upload(
                        newFilePath,
                        textureFile,
                        {
                            cacheControl:
                                "3600",

                            upsert:
                                false,

                            contentType:
                                textureFile.type ||
                                "application/octet-stream"
                        }
                    );


            if (fileError) {

                throw new Error(
                    "新しいテクスチャファイルのアップロードに失敗しました: " +
                    fileError.message
                );

            }

        }




        let newImageURL =
            oldImageURL;


        if (
            newImagePath
        ) {

            const {
                data:
                publicData
            } =
                supabaseClient.storage
                    .from(IMAGE_BUCKET)
                    .getPublicUrl(
                        newImagePath
                    );


            newImageURL =
                publicData?.publicUrl ||
                "";


            if (!newImageURL) {

                throw new Error(
                    "新しい画像URLを取得できませんでした。"
                );

            }

        }




        const newDatabaseFilePath =
            newFilePath ||
            oldFilePath;


        const {
            data:
            updatedData,
            error:
            updateError
        } =
            await supabaseClient
                .from("textures")
                .update({
                    name:
                        name,

                    description:
                        description,

                    version:
                        version,

                    image_url:
                        newImageURL,

                    file_url:
                        newDatabaseFilePath
                })
                .eq(
                    "id",
                    selectedTexture.id
                )
                .select()
                .single();


        if (updateError) {

            throw new Error(
                "Databaseの更新に失敗しました: " +
                updateError.message
            );

        }



        if (
            newImagePath &&
            oldImageURL
        ) {

            const oldImagePath =
                getStoragePathFromURL(
                    oldImageURL,
                    IMAGE_BUCKET
                );


            if (
                oldImagePath
            ) {

                await supabaseClient.storage
                    .from(IMAGE_BUCKET)
                    .remove([
                        oldImagePath
                    ]);

            }

        }




        if (
            newFilePath &&
            oldFilePath
        ) {

            const oldFileStoragePath =
                getStoragePathFromValue(
                    oldFilePath,
                    FILE_BUCKET
                );


            if (
                oldFileStoragePath
            ) {

                await supabaseClient.storage
                    .from(FILE_BUCKET)
                    .remove([
                        oldFileStoragePath
                    ]);

            }

        }


        console.log(
            "編集成功:",
            updatedData
        );


        closeEditModal();


        selectedTexture =
            null;


        await loadTextures();


        alert(
            "テクスチャを更新しました！"
        );


    } catch (error) {

        console.error(
            "Edit error:",
            error
        );


        if (
            newImagePath
        ) {

            await supabaseClient.storage
                .from(IMAGE_BUCKET)
                .remove([
                    newImagePath
                ]);

        }


        if (
            newFilePath
        ) {

            await supabaseClient.storage
                .from(FILE_BUCKET)
                .remove([
                    newFilePath
                ]);

        }


        message.textContent =
            error.message ||
            "編集に失敗しました。";

    } finally {

        submitButton.disabled =
            false;

        submitButton.textContent =
            "SAVE CHANGES";

    }

}


function getStoragePathFromURL(
    value,
    bucket
) {

    if (!value) {

        return "";

    }


    try {

        const url =
            new URL(
                value
            );


        const marker =
            `/storage/v1/object/public/${bucket}/`;


        const index =
            url.pathname.indexOf(
                marker
            );


        if (
            index === -1
        ) {

            return "";

        }


        return decodeURIComponent(
            url.pathname.substring(
                index +
                marker.length
            )
        );

    } catch {

        return "";

    }

}


function getStoragePathFromValue(
    value,
    bucket
) {

    if (!value) {

        return "";

    }


    if (
        value.startsWith("http://") ||
        value.startsWith("https://")
    ) {

        return getStoragePathFromURL(
            value,
            bucket
        );

    }


    return value;

}



async function deleteTexture(
    texture
) {

    if (!isAdmin) {

        alert(
            "管理者のみ削除できます。"
        );

        return;

    }


    if (
        !texture ||
        !texture.id
    ) {

        alert(
            "削除対象のテクスチャが見つかりません。"
        );

        return;

    }


    const confirmed =
        confirm(
            `「${texture.name}」を削除しますか？\n\nこの操作は元に戻せません。`
        );


    if (!confirmed) {

        return;

    }


    try {



        const {
            data:
            userData,
            error:
            userError
        } =
            await supabaseClient.auth.getUser();


        const user =
            userData?.user;


        if (
            userError ||
            !user ||
            user.id !== ADMIN_USER_ID
        ) {

            throw new Error(
                "管理者としてログインしてください。"
            );

        }




        const {
            error:
            deleteError
        } =
            await supabaseClient
                .from("textures")
                .delete()
                .eq(
                    "id",
                    texture.id
                );


        if (deleteError) {

            throw new Error(
                "Databaseから削除できませんでした: " +
                deleteError.message
            );

        }



        if (
            texture.image_url
        ) {

            const imagePath =
                getStoragePathFromURL(
                    texture.image_url,
                    IMAGE_BUCKET
                );


            if (
                imagePath
            ) {

                const {
                    error:
                    imageDeleteError
                } =
                    await supabaseClient.storage
                        .from(IMAGE_BUCKET)
                        .remove([
                            imagePath
                        ]);


                if (imageDeleteError) {

                    console.warn(
                        "画像ファイルの削除に失敗:",
                        imageDeleteError
                    );

                }

            }

        }



        if (
            texture.file_url
        ) {

            const filePath =
                getStoragePathFromValue(
                    texture.file_url,
                    FILE_BUCKET
                );


            if (
                filePath
            ) {

                const {
                    error:
                    fileDeleteError
                } =
                    await supabaseClient.storage
                        .from(FILE_BUCKET)
                        .remove([
                            filePath
                        ]);


                if (fileDeleteError) {

                    console.warn(
                        "テクスチャファイルの削除に失敗:",
                        fileDeleteError
                    );

                }

            }

        }




        selectedTexture =
            null;


        await loadTextures();


        alert(
            "テクスチャを削除しました。"
        );


    } catch (error) {

        console.error(
            "Delete error:",
            error
        );


        alert(
            error.message ||
            "テクスチャの削除に失敗しました。"
        );

    }

}




function scrollToTextures() {

    if (
        elementExists(textureSection)
    ) {

        textureSection.scrollIntoView({
            behavior:
                "smooth"
        });

    }

}




document.addEventListener(
    "keydown",
    function (event) {

        if (
            event.key !==
            "Escape"
        ) {

            return;

        }


        if (
            textureModal &&
            textureModal.classList.contains(
                "active"
            )
        ) {

            closeTextureDetails();

        }


        if (
            adModal &&
            adModal.classList.contains(
                "active"
            )
        ) {

            closeAdModal();

        }


        if (
            loginModal &&
            loginModal.classList.contains(
                "active"
            )
        ) {

            closeLoginModalFunction();

        }


        if (
            termsModal &&
            termsModal.classList.contains(
                "active"
            )
        ) {

            closeTermsModalFunction();

        }


        if (
            privacyModal &&
            privacyModal.classList.contains(
                "active"
            )
        ) {

            closePrivacyModalFunction();

        }


        const editModal =
            document.getElementById(
                "editTextureModal"
            );


        if (
            editModal &&
            editModal.classList.contains(
                "active"
            )
        ) {

            closeEditModal();

        }

    }
);
initializeApp();