import os
import random
import string
import datetime
import pandas as pd
import time

from autogen import ConversableAgent, UserProxyAgent, config_list_from_json

from backend.agents.game.player import *
from backend.agents.game.master import *

characters = string.ascii_letters + string.digits
folder_name = 'output/' + 'game_' + str(datetime.datetime.now().date()) + '-' + str(datetime.datetime.now().hour) + '-' + str(
    datetime.datetime.now().minute) + '-' + str(datetime.datetime.now().second)
file_name = folder_name + '/conversation'

def create_player(player_name, role_desc, backend):
    player = Player(
        name=player_name,
        role_desc=role_desc,
        global_prompt=game_description,
        llm_config=backend
    )
    return player


if __name__ == "__main__":
    if not os.path.exists(folder_name):
        os.makedirs(folder_name)

    players_no = [1, 2, 3, 4, 5]
    characters = ['Merlin', 'Percival', 'Servant', 'Assassin', 'Morgana']
    name2role = {}
    role2name = {}
    shuffled_players = random.sample(players_no, 5)
    for index, player_no in enumerate(shuffled_players):
        name2role['Player' + str(player_no)] = characters[index]
        role2name[characters[index]] = 'Player' + str(player_no)

    

    config_list = config_list_from_json(env_or_file="OAI_CONFIG_LIST")
    backend = {"config_list": config_list}


    players = {}
    for player in name2role:
        if name2role[player] == 'Assassin':
            addition_info = [name for name in name2role if name2role[name] == 'Morgana'][0]
        elif name2role[player] == 'Morgana':
            addition_info = [name for name in name2role if name2role[name] == 'Assassin'][0]
        elif name2role[player] == 'Merlin':
            addition_info = [name for name in name2role if name2role[name] in ['Morgana', 'Assassin']]
            addition_info = ','.join(addition_info)
        elif name2role[player] == 'Percival':
            addition_info = [name for name in name2role if name2role[name] in ['Morgana', 'Merlin']]
            addition_info = ','.join(
                addition_info) + " .However, you don't know which one is Merlin and which one is Morgana, you only know one of them is Merlin and another one is Morgana."
        else:
            addition_info = ''
        players[player] = create_player(player, Role_tips[name2role[player]] + addition_info, backend)


    conversation_df = pd.DataFrame(columns=['agent_name', 'visible_to', 'content', 'turn', 'timestamp', 'msg_type'])
    conversation_df.to_csv(file_name + '.csv', index=False)

    with open(folder_name + "/player_roles.json", "w") as f:
        json.dump(role2name, f)

    moderator = ConversableAgent(name='game master',
    llm_config=backend,
    system_message="You are a helpful game moderator")

    env = AvalonVanilla(players, moderator, role2name, name2role, folder_name)

    print("an example run of 5 steps")
    for i in range(5):
        player_name = env.get_next_player()
        player = players[player_name]
        action = player.generate_reply()
        time.sleep(0.1) 
        action = action["content"]
        env.step(player_name, action)

    ## full version: run until the game reaches the terminal state
    # while True:
    #     player_name = env.get_next_player()
    #     player = players[player_name]
    #     action = player.generate_reply()
    #     time.sleep(0.1)
    #     action = action["content"]
        
    #     # Execute step and break loop if _terminal is True
    #     if env.step(player_name, action):
    #         print("Game has reached the terminal state. Exiting...")
    #         break

    
