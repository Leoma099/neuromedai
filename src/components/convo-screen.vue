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

        <div @click="selectChat(index)">

            <span>{{ chat.title }}</span>

            <button @click="deleteChat()">
                <i class="bx bxs-trash"></i>
            </button>

        </div>

    </div>

    <router-link to="/">Home</router-link> |
                    <router-link to="/about">About</router-link>

</div>

<div class="main-wrapper">

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

            responses: responseMessages.schema,

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
        this.fetchConversation();
        this.fetchMessages();
    },

    methods:
    {
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

        async submit()
        {
            try
            {
                const userInput = this.form.message.trim();
                if (!userInput) return;

                if (this.activeChatIndex === null) {
                    await this.addNewChat();
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
                this.items.unshift({
                    sender: 'You',
                    message: userInput
                });

                this.form.message = "";

                const lowerInput = userInput.toLowerCase();

                const match = this.responses.find(item =>
                    item.keywords.some(keyword => lowerInput.includes(keyword.toLowerCase()))
                );

                const botReply = match
                    ? match.reply
                    : "Sorry, I didn’t understand that. Could you please be more specific about your symptoms or concern?";

                setTimeout(async () =>{

                    await apiCall.post("/send-message", {
                        conversation_id: this.chats[this.activeChatIndex].id,
                        sender: 'Bot',
                        message: botReply,
                    });

                    // Immediately append user's message to this.items
                    this.items.unshift({
                        sender: 'Bot',
                        message: botReply
                    });
                }, 1000);

            }
            catch (error)
            {
                console.error("Error sending message:", error);
            }
        },

        async deleteChat()
        {
        }

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
width: 30px;
height: 30px;
border-radius: 5px;
border: none;
}

.files-button button i
{
font-size: 1.2rem;
}
</style>
