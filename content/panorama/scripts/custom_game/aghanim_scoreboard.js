"use strict";

//-----------------------------------------------------------------------------------------
function intToARGB(i) 
{ 
                return ('00' + ( i & 0xFF).toString( 16 ) ).substr( -2 ) +
                                               ('00' + ( ( i >> 8 ) & 0xFF ).toString( 16 ) ).substr( -2 ) +
                                               ('00' + ( ( i >> 16 ) & 0xFF ).toString( 16 ) ).substr( -2 ) + 
                                                ('00' + ( ( i >> 24 ) & 0xFF ).toString( 16 ) ).substr( -2 );
}

//-----------------------------------------------------------------------------------------
$.Schedule( 0.1, function () 
{
    // Startup code
    for ( var nPlayerID = 0; nPlayerID < 6; ++nPlayerID )
    {
		var playerData = CustomNetTables.GetTableValue( "aghanim_scores", nPlayerID.toString() );
		if ( playerData == null )
		{
			playerData = { kills: 0, death_count: 0, gold_bags: 0 };
		}
	   	UpdateScoreboard( nPlayerID, playerData );
    }
    UpdateBlessings();
  	PopulateClaimedRewardsHud();
});


function ToggleMute( nPlayerID )
{
	if ( nPlayerID !== -1 )
	{
		var newIsMuted = !Game.IsPlayerMuted( nPlayerID );
		Game.SetPlayerMuted( nPlayerID, newIsMuted );
		
		var playerRowPanelPrefix = "Player" + nPlayerID;
		var playerRow = $( "#AghanimScoreboard" ).FindChildInLayoutFile( playerRowPanelPrefix );
		playerRow.SetHasClass( "player_muted", newIsMuted );
	}	
}

function UpdateScoreboard( playerID, data )
{
	var playerRowPanelPrefix = "Player" + playerID;
	var playerRow = $( "#AghanimScoreboard" ).FindChildInLayoutFile( playerRowPanelPrefix );
	if ( playerRow === null )
		return;

	playerRow.SetHasClass( "Hide", false );
	playerRow.SetHasClass( "player_muted", Game.IsPlayerMuted( playerID ) )
	playerRow.SetHasClass( "local_player", Game.GetLocalPlayerID() == playerID )

	var playerKills = playerRow.FindChildInLayoutFile( playerRowPanelPrefix + "Kills" );
	playerKills.text = data["kills"];

	var playerDeaths = playerRow.FindChildInLayoutFile( playerRowPanelPrefix + "Deaths" );
	playerDeaths.text = data["death_count"];

	var playerBags = playerRow.FindChildInLayoutFile( playerRowPanelPrefix + "Bags" );
	playerBags.text = data["gold_bags"];
}

function UpdateBlessings( )
{
	var blessingsData = CustomNetTables.GetTableValue( "game_global", "blessings" );

    Object.keys(blessingsData).forEach( function(key) 
    {
        var nPlayerID = Number( key )

		var blessingsRow = $( "#BlessingPlayers" ).FindChildInLayoutFile( key );
		if ( blessingsRow === null )
			return;

 		var blessingsList = blessingsRow.FindChildInLayoutFile( "BlessingsList" );
		blessingsList.RemoveAndDeleteChildren();

 	   	Object.keys( blessingsData[key] ).forEach( function(subkey) 
    	{
    		var szActionName = subkey;

			var nOrder = Number( blessingsData[key][subkey] );
			var hBeforeChild = null;
			for ( var nChild = 0; nChild < blessingsList.GetChildCount(); nChild++ )
			{
				var hChild = blessingsList.GetChild( nChild );
				if ( hChild == null )
					continue;

				if ( hChild.GetAttributeInt( "order", 0 ) >= nOrder )
				{
					hBeforeChild = hChild;
					break;
				}
			}

 			var blessing = $.CreatePanel( 'Panel', blessingsList, '' );
			blessing.BLoadLayoutSnippet( "Blessing" );
	        if ( hBeforeChild != null )
	        {
	        	blessingsList.MoveChildBefore( blessing, hBeforeChild );
	        }
	        blessing.SetAttributeInt( "order", nOrder );

			var blessingImage = blessing.FindChildInLayoutFile( "BlessingImage" );
			blessingImage.AddClass( szActionName );

		    blessing.SetDialogVariable("blessing_name", $.Localize( "DOTA_TI10_EventGame_" + szActionName + "_Title" ) );
		    blessing.SetDialogVariable("blessing_description", $.Localize( "DOTA_TI10_EventGame_" + szActionName + "_Desc" ) );
        });
    });
}

CustomNetTables.SubscribeNetTableListener( "game_global", UpdateBlessings )

function ToggleBlessings()
{
	$.GetContextPanel().ToggleClass( "BlessingsVisible" );
}

function InitializeScoreboard()
{
	var i = 0
	for ( i; i < 6; i++ )
	{
		var playerID = i;
		var playerRowPanelPrefix = "Player" + playerID;
		var playerHeroEntIndex = Players.GetPlayerHeroEntityIndex( playerID );
		var playerRow = $( "#PlayerContainer" ).FindChildInLayoutFile( playerRowPanelPrefix );

		var colorInt = Players.GetPlayerColor( playerID );
		var colorString = "#" + intToARGB( colorInt );

		if ( playerRow !== null )
		{
			playerRow.SetHasClass( "player_muted", Game.IsPlayerMuted( playerID ) )
			playerRow.SetHasClass( "local_player", Game.GetLocalPlayerID() == playerID )
			playerRow.SetAttributeInt( "player_id", playerID );

			var playerColor = playerRow.FindChildInLayoutFile( playerRowPanelPrefix + "Color" );
			playerColor.style.backgroundColor = colorString;

			var playerHeroNameLabel = playerRow.FindChildInLayoutFile( playerRowPanelPrefix + "HeroName" );
			playerHeroNameLabel.text = Players.GetPlayerSelectedHero( playerID );
			if ( playerHeroNameLabel.text === "invalid index" )
			{
				 playerHeroNameLabel.text = "";
			} 

			var playerNameLabel = playerRow.FindChildInLayoutFile( playerRowPanelPrefix + "PlayerName" );
			playerNameLabel.text = Players.GetPlayerName( playerID );

			var playerHeroImage = playerRow.FindChildInLayoutFile( playerRowPanelPrefix + "HeroImage" );
			playerHeroImage.heroname = Players.GetPlayerSelectedHero( playerID );

			var playerKills = playerRow.FindChildInLayoutFile( playerRowPanelPrefix + "Kills" );
			playerKills.text = 0;

			var playerDeaths = playerRow.FindChildInLayoutFile( playerRowPanelPrefix + "Deaths" );
			playerDeaths.text = 0;

			var playerBags = playerRow.FindChildInLayoutFile( playerRowPanelPrefix + "Bags" );
			playerBags.text = 0;
		}

		var blessingsRow = $.CreatePanel( 'Panel', $( "#BlessingPlayers" ), playerID.toString() );
		blessingsRow.BLoadLayoutSnippet( "BlessingRow" );
		blessingsRow.SetHasClass( "local_player", Game.GetLocalPlayerID() == playerID )
		blessingsRow.SetAttributeInt( "player_id", playerID );

		var playerColor = blessingsRow.FindChildInLayoutFile( "PlayerColor" );
		playerColor.style.backgroundColor = colorString;

		var playerHeroNameLabel = blessingsRow.FindChildInLayoutFile( "PlayerHeroName" );
		playerHeroNameLabel.text = Players.GetPlayerSelectedHero( playerID );
		if ( playerHeroNameLabel.text === "invalid index" )
		{
			 playerHeroNameLabel.text = "";
		} 

		var playerNameLabel = blessingsRow.FindChildInLayoutFile( "PlayerName" );
		playerNameLabel.text = Players.GetPlayerName( playerID );

		var playerHeroImage = blessingsRow.FindChildInLayoutFile( "HeroImage" );
		playerHeroImage.heroname = Players.GetPlayerSelectedHero( playerID );
	}
}

function UpdateRoomRewards()
{
	var hRewardsList = $( "#RoomRewardsList" );
	hRewardsList.RemoveAndDeleteChildren();

	var hAllRoomData = CustomNetTables.GetAllTableValues( "room_data" );
	for ( var i = 0; i < hAllRoomData.length; ++i )
	{	
		var roomData = hAllRoomData[i]["value"];
 		if ( roomData == null )
			continue;

		if ( Number( roomData["completed"] ) != 1 && Number( roomData["current_room"] ) != 1 )
			continue;

		if ( roomData["room_type"] == 5 || roomData["room_type"] == 6 )
			continue;

		if ( roomData["reward"] == null )
			continue;

		var nOrder = Number( roomData["depth"] );

		var hBeforeChild = null;
		for ( var nChild = 0; nChild < hRewardsList.GetChildCount(); nChild++ )
		{
			var hChild = hRewardsList.GetChild( nChild );
			if ( hChild == null )
				continue;

			if ( hChild.GetAttributeInt( "order", 0 ) >= nOrder )
			{
				hBeforeChild = hChild;
				break;
			}
		}

		var reward = $.CreatePanel( 'Panel', hRewardsList, '' );
 		reward.BLoadLayoutSnippet( "RoomReward" );
       if ( hBeforeChild != null )
        {
        	hRewardsList.MoveChildBefore( reward, hBeforeChild );
        }
        reward.SetAttributeInt( "order", nOrder );
		reward.AddClass( roomData["reward"] );
		reward.SetDialogVariable("reward_name", $.Localize( "DOTA_HUD_" + roomData["reward"] + "_Desc" ) );
    }
}

function OnScoreboardDataUpdated( table_name, key, data )
{
	UpdateScoreboard( Number( key ), data );
}

CustomNetTables.SubscribeNetTableListener( "aghanim_scores", OnScoreboardDataUpdated )

function OnRoomDataUpdated( table_name, key, data )
{
	UpdateRoomRewards( );
}

CustomNetTables.SubscribeNetTableListener( "room_data", OnRoomDataUpdated )

function SetFlyoutScoreboardVisible( bVisible )
{
	$.GetContextPanel().SetHasClass( "flyout_scoreboard_visible", bVisible );
}

// this is a dummy event to capture errant clicks on the scoreboard background
function DummyClickAghanimScoreboard() { }

function CloseAghanimScoreboard()
{
	$.DispatchEvent( "DOTAHUDToggleScoreboard" )
	$.GetContextPanel().SetHasClass( "flyout_scoreboard_visible", false );
	$.GetContextPanel().SetHasClass( "round_over", false );
}

(function()
{	
	InitializeScoreboard();
	SetFlyoutScoreboardVisible( false );
	
	$.RegisterEventHandler( "DOTACustomUI_SetFlyoutScoreboardVisible", $.GetContextPanel(), SetFlyoutScoreboardVisible );
})();


function PopulateClaimedRewardsHud() 
{
	var CurrentRoom = CustomNetTables.GetTableValue( "reward_choices", "current_depth" );
    var szCurrentDepth = CurrentRoom ? CurrentRoom["1"] : null;
	if (szCurrentDepth == null)
	{
		//$.Msg("nCurrentDepth not found");
		return;
	}
	
	var nCurrentDepth = Number( szCurrentDepth );

	//Reconstruct the reward choices for each player for each depth
	var j = 0
	for ( j; j < 4; j++ )
	{	
		var bNeedsRefresh = true;
		var szPlayerID = j;

		var i = 1
		for ( i; i <= nCurrentDepth; i++ )
		{			
			var RewardChoices = CustomNetTables.GetTableValue( "reward_choices", i )	
			if (!RewardChoices)
			{
				//$.Msg("RewardChoices for depth ", i, " not found");
		        continue;
			}

			var RewardChoice = RewardChoices[szPlayerID]
			if (!RewardChoice) 
			{
	        	//$.Msg("RewardChoice for PlayerID ", szPlayerID, " at depth ", i, " not found");
	        	continue;
    		}

    		var playerRowPanelPrefix = "Player" + szPlayerID;
			var playerRow = $( "#PlayerContainer" ).FindChildInLayoutFile( playerRowPanelPrefix );
			var parentPanel = playerRow.FindChildInLayoutFile( "Player" + szPlayerID + "Rewards" );

			if (bNeedsRefresh)
			{
				parentPanel.RemoveAndDeleteChildren(); 
				bNeedsRefresh = false;	
			}

			var claimedRewardPanel = $.CreatePanel('Panel', parentPanel, '');
    
		    claimedRewardPanel.BLoadLayoutSnippet("RewardOptionSnippet_" + RewardChoice["reward_type"]);
		    claimedRewardPanel.AddClass("RewardOptionContainer");
		    claimedRewardPanel.AddClass("RewardOptionType_" + RewardChoice["reward_type"]);
		    claimedRewardPanel.AddClass("RewardOptionTier_" + RewardChoice["reward_tier"]);
		    claimedRewardPanel.AddClass("RewardOptionRarity_" + RewardChoice["rarity"]);

		    var RewardAbilityImage = claimedRewardPanel.FindChildTraverse("RewardAbilityImage");
		    if ( RewardAbilityImage ) 
		    {
		    	if ( RewardChoice[ "reward_type" ] == "REWARD_TYPE_MINOR_STATS_UPGRADE" )
		    	{
		        	RewardAbilityImage.SwitchClass( "minor_stat_upgrade", RewardChoice[ "description" ] );
		        }
		        else
		        {
		        	RewardAbilityImage.abilityname = RewardChoice["ability_name"];     	
		        }
		  		RewardAbilityImage.SetDialogVariable( "reward_name", GetName( RewardChoice, RewardAbilityImage ) );
		    	RewardAbilityImage.SetDialogVariable( "reward_description", GetDescription( RewardChoice, RewardAbilityImage ) );
		    }

		    var RewardItemImage = claimedRewardPanel.FindChildTraverse("RewardItemImage");
		    if (RewardItemImage) 
		    {
		        RewardItemImage.itemname = RewardChoice["ability_name"];
		    }

		    if (RewardChoice["quantity"]) 
		    {
		        claimedRewardPanel.SetDialogVariableInt("quantity", RewardChoice["quantity"]);
		    }

		    if ( RewardChoice[ "reward_type" ] == "REWARD_TYPE_MINOR_ABILITY_UPGRADE" || RewardChoice[ "reward_type" ] == "REWARD_TYPE_MINOR_STATS_UPGRADE") 
		    {
		        claimedRewardPanel.SetDialogVariable("ability_name", GetName(RewardChoice, claimedRewardPanel));
		        var flValue = RewardChoice["value"];
		        claimedRewardPanel.SetDialogVariable("value", Math.floor(flValue) == flValue ? Math.floor(flValue) : flValue.toFixed(1));
		    }
		    claimedRewardPanel.SetDialogVariable("tier", $.Localize("DOTA_HUD_" + RewardChoice["reward_tier"] + "_Desc"));

		    claimedRewardPanel.SetDialogVariable("reward_name", GetName(RewardChoice, claimedRewardPanel));
		    claimedRewardPanel.SetDialogVariable("reward_description", GetDescription(RewardChoice, claimedRewardPanel));
		}
	}
}

CustomNetTables.SubscribeNetTableListener( "reward_choices", PopulateClaimedRewardsHud )

function GetName( reward, rewardPanel )
{
    var szName;
    if ( reward[ "reward_type" ] === "REWARD_TYPE_ABILITY_UPGRADE" 
        || reward[ "reward_type" ] === "REWARD_TYPE_ITEM" 
        || reward[ "reward_type" ] === "REWARD_TYPE_TEMP_BUFF" 
        || reward[ "reward_type" ] === "REWARD_TYPE_AURA"  
        || reward[ "reward_type" ] === "REWARD_TYPE_MINOR_ABILITY_UPGRADE"
        || reward[ "reward_type" ] === "REWARD_TYPE_MINOR_STATS_UPGRADE")
    { 
        szName = "DOTA_Tooltip_ability_" + reward[ "ability_name" ];
    }

    if ( reward[ "reward_type" ] === "REWARD_TYPE_GOLD" )
    {
        szName = "DOTA_HUD_Reward_Gold";
    }

    if ( reward[ "reward_type" ] === "REWARD_TYPE_EXTRA_LIVES" )
    {
        szName = "DOTA_HUD_Reward_ExtraLives";
    }

    return $.Localize( szName, rewardPanel );
}

function GetDescription( reward, rewardPanel )
{
    
    if (!reward)
    {
    	return "COULD NOT FIND REWARD IN GetDescription";
    }
    if ( reward[ "reward_type" ] === "REWARD_TYPE_ABILITY_UPGRADE" || reward[ "reward_type" ] === "REWARD_TYPE_ITEM" || reward[ "reward_type" ] === "REWARD_TYPE_TEMP_BUFF" || reward[ "reward_type" ] === "REWARD_TYPE_AURA" ) 
        return GameUI.ReplaceDOTAAbilitySpecialValues( reward[ "ability_name" ], $.Localize( "DOTA_Tooltip_ability_" + reward[ "ability_name" ] + "_Description", rewardPanel ) );
    
    if ( reward[ "reward_type" ] === "REWARD_TYPE_MINOR_ABILITY_UPGRADE" || reward[ "reward_type" ] === "REWARD_TYPE_MINOR_STATS_UPGRADE" )
        return $.Localize( reward[ "description" ], rewardPanel );

    if ( reward[ "reward_type" ] === "REWARD_TYPE_GOLD" )
        return $.Localize( "DOTA_HUD_Reward_Gold_desc", rewardPanel );

    if ( reward[ "reward_type" ] === "REWARD_TYPE_EXTRA_LIVES" )
        return $.Localize( "DOTA_HUD_Reward_ExtraLives_desc", rewardPanel );

   return "FIX ME";
}

