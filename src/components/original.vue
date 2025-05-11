<template>

    <div class="sidebar">

        <!-- LOGO -->
        <div class="sidebar-logo">
            <p>PeopleCARE</p>
        </div>

        <div class="new-box">
            <button type="button" @click="addNewChat()">New chat +</button>
        </div>

        <div class="select-chat" v-for="(chat, index) in chats" :key="index">
            <button type="button" @click="selectChat(index)">
                {{ chat.title }} {{ chat.id }}
            </button>
        </div>

        <!-- MENU -->
        <nav>

            <div class="logout-nav">
                <div>
                    <a href="">Logout</a>
                </div>
            </div>

                  <router-link to="/">Home</router-link> |
                    <router-link to="/about">About</router-link>

        </nav>

    </div>

    <div class="main-wrapper">
        
        <header>

            <div class="left">
                <button><i class="bx bx-menu"></i></button>
            </div>

        </header>

        <div class="main">

            <div class="conversation-screen" v-if="!isEmpty" ref="conversationContainer">
                <div v-for="(item, index) in items" :key="index" :class="item.sender === 'You' ? 'message' : 'response'">
                    {{ item.message }}
                </div>
            </div>
            
            <div class="empty-screen" v-else>
                <h1>Welcome to AskDoctor AI. How may I help you?</h1>
            </div>

            <div class="chat-form">
                <div class="chat">
                    <form @submit.prevent="submit">
                        <div class="form-input">
                            <textarea
                                ref="messageTextarea"
                                placeholder="Ask anything about symptom"
                                v-model="form.message"
                                @input="autoResize($event)"
                                @keydown.enter.prevent="submit">
                            </textarea>
                        </div>
                        <div class="form-wrapper">
                            <div class="files-button">
                                <button type="file" @click="addFiles()"><i class="bx bxs-file-plus"></i> Add photos and files</button>
                                <input type="file" ref="fileInput" style="display: none" multiple>
                            </div>
                            <div class="form-button">
                                <button type="submit"><i class="bx bxl-telegram"></i></button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>

        </div>

    </div>

</template>

<script>
import responseMessages from '@/assets/data.json';
export default
{
    data()
    {

        return {

            items: [],

            form:
            {
                message: "",
            },

            responses: responseMessages.schema, //Data JSON

            chats: [],
            activeChatIndex: null,
            chatCounter: 1,

        };

    },

    computed:
    {
        isEmpty()
        {
            return this.items.length === 0;
        }
    },

    methods:
    {
        autoResize(event)
        {
            const textarea = event.target;
            textarea.style.height = 'auto';
            textarea.style.height = textarea.scrollHeight + 'px';
        },

        addFiles()
        {
            this.$refs.fileInput.click();
        },
        
        addNewChat()
        {
            const newChat =
            {
                title: "Chat ID: " + this.chatCounter,
                messages: []
            };

            this.chats.unshift(newChat);
            this.activeChatIndex = 0;
            this.items = this.chats[this.activeChatIndex].messages;
            this.form.message = "";
            this.chatCounter++;
        },

        selectChat(index)
        {
            this.activeChatIndex = index;
            this.items = this.chats[index].messages;
            this.form.message = "";
        },

        async submit()
        {
            try
            {
                const userInput = this.form.message.trim();
                if (!userInput) return;

                if (this.activeChatIndex === null)
                {
                    this.addNewChat();
                }

                this.$nextTick(() =>
                {
                    const textarea = this.$refs.messageTextarea;
                    if (textarea)
                    {
                        textarea.style.height = 'auto'; // Reset height to auto
                    }
                });

                this.items.unshift({ sender: "You", message: userInput });  // Add user message at the top
                this.form.message = "";

                const lowerInput = userInput.toLowerCase();

                const match = this.responses.find(item =>
                    item.keywords.some(keyword => lowerInput.includes(keyword.toLowerCase()))
                );

                const botReply = match
                    ? match.reply
                    : "Sorry, I didn’t understand that. Could you please be more specific about your symptoms or concern?";

                setTimeout(() => {
                    this.items.unshift({ sender: "Bot", message: botReply });  // Add bot reply at the top
                }, 1000);


            }

            catch (error)
            {
                console.error(error);
            }
        },
    },

};
</script>

<style scoped>
.form-button button
{
    width: 30px;
    height: 30px;
    border-radius: 5px;
    border: none;
}

.form-button button i
{
    font-size: 1.2rem;
}

.left button
{
    width: 30px;
    height: 30px;
    border-radius: 5px;
    border: none;
}

.left button i
{
    font-size: 1.2rem;
    font-weight: 600;
}

.files-button button
{
    width: 175px;
    height: 30px;
    border-radius: 5px;
    border: none;
}

.files-button button i
{
    font-size: 1.2rem;
}
</style>
