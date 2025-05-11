<template>

<div class="sidebar">

    <!-- LOGO -->
    <div class="sidebar-logo">

        <router-link :to="'/'" @click.prevent="reloadPage">
            <h2>NeuroMed AI</h2>
        </router-link>

    </div>

    <div class="new-box">

        <button type="button" @click="addNewChat()">New chat +</button>

    </div>

    <ul class="select-chat" v-for="(chat, index) in chats" :key="index">

        <li :class="{ 'active-chat': activeChatIndex === index }">
            <router-link
                :to="{ name: 'Chat', params: {id: chat.id} }"
                @click="selectChat(index)">

                <div class="list-wrapper">

                    <div>
                        <span>{{ chat.title }}</span>
                    </div>

                    <div>
                        <button @click="deleteChat(index)">
                            <i class="bx bxs-trash"></i>
                        </button>
                    </div>

                </div>

            </router-link>
        </li>

    </ul>

</div>

<div class="main-wrapper">

    <div class="main">

        <div class="conversation-screen" v-if="!isEmpty" ref="conversationContainer">

            <div v-for="(item, index) in items" :key="index" :class="item.sender === 'You' ? 'message' : 'response'">

                {{ item.message }}

            </div>

        </div>

        <div class="empty-screen" v-else>

            <h3>Welcome to NeuroMed AI — your intelligent companion for smarter, faster patient care. How can I assist you today?</h3>

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
                            <button type="file" @click="addFiles()"><i class="bx bxs-file-image"></i></button>
                            <input type="file" ref="fileInput" style="display: none" multiple @change="handleFileUpload">
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
import apiCall from "@/services/index";
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

            chats: [],
            activeChatIndex: null,
            chatCounter: 1,

        };

    },

    computed:
    {
        isEmpty()
        {
            return !this.items || this.items.length === 0;
        }
    },

    mounted()
    {

        const chatId = this.$route.params.id;

        if(chatId)
        {
            this.fetchMessages(chatId);
        }
        else
        {
            this.fetchConversation();
        }
    },

    methods:
    {
        scrollToBottom()
        {
            this.$nextTick(() => {
                const container = this.$refs.conversationContainer;
                if(container)
                {
                    container.scrollTop = container.scrollHeight;
                }
            })
        },

        async fetchConversation()
        {
            try
            {
                const response = await apiCall.get("/conversation");
                console.log("Fetched conversations:", response.data);
                this.chats = response.data.sort((a, b) => b.id - a.id);
            }
            catch(error)
            {
                console.error("Error fetching conversations:", error.response || error);
            }
        },

        async fetchMessages(conversationId)
        {
            try
            {
                const response = await apiCall.get(`/conversations/${conversationId}/messages`);
                this.items = response.data;
                this.scrollToBottom();
                console.log("Messages for conversation", conversationId, ":", this.items);
            }
            catch (error)
            {
                console.error("Error fetching messages:", error);
            }
        },

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
        
        async addNewChat()
        {
            try
            {
                const response = await apiCall.post('/new-chat');

                const newChat = response.data;
                this.chats.unshift({ ...newChat, messages: [] });
                this.activeChatIndex = 0;

                this.$router.push({ name: 'Chat', params: { id: newChat.id } });

                await this.fetchMessages(newChat.id);
                this.form.message = "";
            }
            catch(error)
            {
                console.error("Error creating new chat:", error);
            }
        },

        async selectChat(index)
        {
            this.activeChatIndex = index;
            const conversation = this.chats[index];

            try
            {
                await this.fetchMessages(conversation.id);
                this.form.message = "";
            }
            catch (error)
            {
                console.error("Error fetching messages:", error);
            }
        },

        reloadPage()
        {
            window.location.href = '/';
        },

        async submit()
        {
            try
            {
                const userInput = this.form.message.trim();
                if (!userInput) return;

                if (this.activeChatIndex === null) {
                    await this.addNewChat();
                }

                if (this.activeChatIndex === null)
                {
                    const response = await apiCall.post('/new-chat');
                    const newChat = response.data;
                    this.chats.push({ ...newChat, messages: [] });
                    this.activeChatIndex = 0;

                    // Navigate to new chat route
                    this.$router.push({ name: 'Chat', params: { id: newChat.id } });

                    await this.fetchMessages(newChat.id);
                }

                this.$nextTick(() =>
                {
                    const textarea = this.$refs.messageTextarea;
                    if (textarea)
                    {
                        textarea.style.height = 'auto'; // Reset height to auto
                    }
                });

                // Send user message
                await apiCall.post("/send-message", {
                    conversation_id: this.chats[this.activeChatIndex].id,
                    sender: 'You',
                    message: userInput,
                });

                // Immediately append user's message to this.items
                this.items.push({
                    sender: 'You',
                    message: userInput
                });

                this.scrollToBottom();

                this.form.message = "";

                // Get bot reply from the Laravel API
                const response = await apiCall.post("/bot-reply", {
                    message: userInput
                });

                const botReply = response.data.reply;

                setTimeout(async () =>{

                    await apiCall.post("/send-message", {
                        conversation_id: this.chats[this.activeChatIndex].id,
                        sender: 'Bot',
                        message: botReply,
                    });

                    // Immediately append user's message to this.items
                    this.items.push({
                        sender: 'Bot',
                        message: botReply
                    });

                    this.scrollToBottom();
                }, 1000);

            }
            catch (error)
            {
                console.error("Error sending message:", error);
            }
        },

        async deleteChat(index)
        {

            try
            {
                const conversation = this.chats[index];

                await apiCall.delete(`/conversations/${conversation.id}`);

                // Remove from local list without reload
                this.chats.splice(index, 1);

                // Clear messages if the active chat was deleted
                if (this.activeChatIndex === index)
                {
                    this.items = [];
                    this.activeChatIndex = null;
                }

            }
            catch(error)
            {
                console.error("Error deleting chat:", error);
            }
        }



    },

    watch:
    {
        '$route.params.id'(newId)
        {
            if(newId)
            {
                this.fetchMessages(newId);
            }
        }
    }
};
</script>

<style scoped>
.form-button button
{
width: 30px;
height: 30px;
border-radius: 5px;
border: none;
background-color: #d3d3d3;
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
width: 30px;
height: 30px;
border-radius: 5px;
border: none;
background-color: #d3d3d3;
}

.files-button button i
{
font-size: 1.2rem;
}

.active-chat
{
    background-color: #ff0000;
    border-radius: 5px;
}

</style>
