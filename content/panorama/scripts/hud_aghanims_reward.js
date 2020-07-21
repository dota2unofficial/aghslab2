"use strict"

var AghanimRewardsHUD = $.GetContextPanel().FindChildInLayoutFile("AghanimRewardsHUD");
var AghanimRewardsMinimized = $.GetContextPanel().FindChildInLayoutFile("AghanimRewardsMinimized");
var RewardsContainer = $.GetContextPanel().FindChildInLayoutFile("RewardsContainer");
var AghanimScoreboardInfo = $.GetContextPanel().FindChildInLayoutFile("AghanimScoreboardInfo");



var g_nLoopHandle = 0;
var g_szCurrentlyDisplayedDepth = 0;

function ShowAghanimRewardsHUD( bShow, bMinimized )
{
    var nOpenHandle = 0;
    if( bShow && !bMinimized )
    {
        //Game.EmitSound("ui.books.pageturns");
        nOpenHandle = Game.EmitSound("RewardScreenOpen"); 
        if( g_nLoopHandle == 0 )
        {
        //    g_nLoopHandle = Game.EmitSound("RewardScreenIdle"); 
        }
    }
    else
    {
        //Game.StopSound( g_nLoopHandle )
        g_nLoopHandle = 0;
    }
    
    AghanimRewardsHUD.SetHasClass("Hidden", !bShow);
    AghanimRewardsHUD.SetHasClass("Minimized", bMinimized);

    AghanimRewardsMinimized.SetHasClass("Hidden", !bShow);
    AghanimRewardsMinimized.SetHasClass("Minimized", bMinimized);
}

function GetLocalHeroName() 
{
    var localPlayerId = Game.GetLocalPlayerID();
    return Players.GetPlayerSelectedHero(localPlayerId);
}

function OnRewardClicked( nRewardIndex, eRewardType, nRoomDepth )
{
    //$.Msg("clicked reward "+nRewardIndex);
    var data = {}
    data["room_depth"] = nRoomDepth;
    data["reward_index"] = nRewardIndex;
    GameEvents.SendCustomGameEventToServer("reward_choice", data);
}

function OnRewardOptions( table_name, key, data )
{
    //$.Msg("reward options");
    $.Schedule( 1.5, function() { CheckForRewardsHUD( false ) } );    
}

CustomNetTables.SubscribeNetTableListener( "reward_options", OnRewardOptions );

function OnRewardChoicesRefreshed( table_name, key, data )
{
    var szPlayerID = Game.GetLocalPlayerID().toString();
    var RoomChoice = data[ szPlayerID ];
    if ( RoomChoice == null || RoomChoice.reward_type == null)
        return;

     // close the UI if we've made a reward choice for the current room
    if( !AghanimRewardsHUD.BHasClass("Hidden") )
    {
        Game.EmitSound( "RewardChosen." + RoomChoice.reward_type );

        // If we're depth 1, and a new player, show info about where to find upgrades
        if ( key == 1 )
        {
            ShowScoreboardInfoIfNewPlayer( Game.GetLocalPlayerID() )
        }
    }
    
    // Hide it, but only if we haven't already gone to another depth
    // which can happen during test_encounter
    if ( key == g_szCurrentlyDisplayedDepth )
    {
        ShowAghanimRewardsHUD( false, false ); 
    }
    else
    {
         CheckForRewardsHUD( true );    
    }
}

CustomNetTables.SubscribeNetTableListener( "reward_choices", OnRewardChoicesRefreshed )

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

function ShowScoreboardInfoIfNewPlayer( nPlayerID )
{
    var NewPlayers = CustomNetTables.GetTableValue( "game_global", "new_players" );
    if ( NewPlayers == null )
        return;

    var value;
    Object.keys(NewPlayers).some(function(key) 
    {
        if ( nPlayerID == NewPlayers[key] )
        {
            AghanimScoreboardInfo.AddClass( "Visible" );
            AghanimScoreboardInfo.RemoveClass( "Visible" );               
           return true;
        }
        return false;
    });
}

function CheckForRewardsHUD( bForce )
{
    var szPlayerID = Game.GetLocalPlayerID().toString();
    
    var CurrentRoom = CustomNetTables.GetTableValue( "reward_options", "current_depth" );
    //$.Msg("CurrentRoom "+JSON.stringify(CurrentRoom) );
    var szCurrentDepth = CurrentRoom ? CurrentRoom["1"] : null;
    //$.Msg("szCurrentDepth "+szCurrentDepth );
    var RewardOptions = CustomNetTables.GetTableValue( "reward_options",  szCurrentDepth );
    var RewardChoices = CustomNetTables.GetTableValue( "reward_choices",  szCurrentDepth );

    var RoomRewards = RewardOptions ? RewardOptions[szPlayerID] : null;
    var RoomChoice = RewardChoices ? RewardChoices[szPlayerID] : null;

    // ignore if we don't yet have a reward option for the current room, or if we've already made a choice
    if( !RoomRewards || ( RoomChoice != null ) )
    {
        //$.Msg("OnRewardOptions: No Reward data, aborting!");
        return;
    }

    // Ignore if we have already displayed this depth
    if ( ( g_szCurrentlyDisplayedDepth == szCurrentDepth ) && !bForce )
    {
        //$.Msg("OnRewardOptions: Ignoring, duplicate depth!");
        return;
    }

    g_szCurrentlyDisplayedDepth = szCurrentDepth;

    // Figure out if they didn't choose the last room's reward, show that instead
    for ( var i = Number( szCurrentDepth ) - 1; i >= 1; i-- )
    {
        var prevRewardChoices = CustomNetTables.GetTableValue( "reward_choices", i.toString() );
        var prevPlayerChoice = prevRewardChoices ? prevRewardChoices[szPlayerID] : null;
        if ( prevPlayerChoice != null )
            break;
 
        var prevRewardOptions = CustomNetTables.GetTableValue( "reward_options", i.toString() );
        var prevRoomRewards = prevRewardOptions ? prevRewardOptions[szPlayerID] : null;
        if ( prevRoomRewards == null )
            continue;

        //$.Msg( "Backing out to depth ", i );
        szCurrentDepth = i.toString();
        RewardOptions = prevRewardOptions;
        RoomRewards = prevRoomRewards;
    }

    //$.Msg( "Depth ", szCurrentDepth );
    //$.Msg("room rewards: "+JSON.stringify(RoomRewards) );
    //$.Msg("reward choice: "+JSON.stringify(RoomChoice) );

    var nBattlePoints = 0;
    if ( RewardOptions[ "battle_points" ] != null )
    {
        nBattlePoints = RewardOptions[ "battle_points" ][ szPlayerID ] ? RewardOptions[ "battle_points" ][ szPlayerID ] : 0;
    }
    var nArcaneFragments = 0;
    if ( RewardOptions[ "arcane_fragments" ] != null )
    {
        nArcaneFragments = RewardOptions[ "arcane_fragments" ][ szPlayerID ] ? RewardOptions[ "arcane_fragments" ][ szPlayerID ] : 0;
    }
    var nXP = RewardOptions[ "xp" ] ? RewardOptions[ "xp" ] : 0;
    var nGold = RewardOptions["gold"] ? RewardOptions["gold"] : 0;

    AghanimRewardsHUD.SetHasClass( "StartingRoom", szCurrentDepth == 1 )
    AghanimRewardsHUD.SetHasClass( "NoCurrencyReward", nBattlePoints == 0 && nArcaneFragments == 0 );
    AghanimRewardsHUD.SetDialogVariableInt( "battle_points", nBattlePoints );
    AghanimRewardsHUD.SetDialogVariableInt( "arcane_fragments", nArcaneFragments );
    AghanimRewardsHUD.SetDialogVariableInt( "xp", nXP );
    AghanimRewardsHUD.SetDialogVariableInt( "gold", nGold );
 
    SetRewardHUDRarity(RewardOptions["rarity"] ? RewardOptions["rarity"] : "");

    RewardsContainer.RemoveAndDeleteChildren(); 

    for (var ii = 1; ii < Object.keys(RoomRewards).length+1; ++ii)
    {
        var RoomReward = RoomRewards[ii.toString()];
        var rewardPanel = $.CreatePanel('RadioButton', RewardsContainer, '');
        //$.Msg("creating panel "+rewardPanel);
        rewardPanel.BLoadLayoutSnippet("RewardOptionSnippet_"+RoomReward["reward_type"]);
        rewardPanel.AddClass("RewardOptionContainer");
        rewardPanel.AddClass("RewardOptionType_"+RoomReward["reward_type"]);
        rewardPanel.AddClass("RewardOptionTier_"+RoomReward["reward_tier"]);
        rewardPanel.AddClass("RewardOptionRarity_" + RoomReward["rarity"]);

        var RewardAbilityImage = rewardPanel.FindChildTraverse("RewardAbilityImage");
        if( RewardAbilityImage )
        {
            if ( RoomReward[ "reward_type" ] == "REWARD_TYPE_MINOR_STATS_UPGRADE" )
            {
                RewardAbilityImage.SwitchClass( "minor_stat_upgrade", RoomReward[ "description" ] );
            }
            else
            {
                RewardAbilityImage.abilityname = RoomReward["ability_name"];
            }
        }

        var RewardItemImage = rewardPanel.FindChildTraverse( "RewardItemImage" );
        if( RewardItemImage )
        {
            RewardItemImage.itemname = RoomReward["ability_name"];
        }

        if( RoomReward["quantity"] )
        {
            rewardPanel.SetDialogVariableInt("quantity", RoomReward["quantity"] );
        }

        if (RoomReward[ "reward_type" ] == "REWARD_TYPE_MINOR_ABILITY_UPGRADE" || RoomReward[ "reward_type" ] == "REWARD_TYPE_MINOR_STATS_UPGRADE" )
        {
            rewardPanel.SetDialogVariable( "ability_name", GetName( RoomReward, rewardPanel ) ); 
            var flValue = RoomReward[ "value" ];
            rewardPanel.SetDialogVariable( "value", Math.floor(flValue) == flValue ? Math.floor(flValue) : flValue.toFixed(1) ); 
        }
 //       if (RoomReward["reward_type"] == "REWARD_TYPE_MINOR_STATS_UPGRADE")
 //       {
 //           rewardPanel.SetDialogVariable( "ability_name", GetName( RoomReward, rewardPanel ) ); 
 //           var flValue = RoomReward[ "value" ];
 //           rewardPanel.SetDialogVariable( "value", Math.floor(flValue) == flValue ? Math.floor(flValue) : flValue.toFixed(1) ); 
 //       }
        rewardPanel.SetDialogVariable( "tier", $.Localize( "DOTA_HUD_"+RoomReward["reward_tier"]+"_Desc" ) );

        rewardPanel.SetDialogVariable( "reward_name", GetName( RoomReward, rewardPanel ) );
        rewardPanel.SetDialogVariable( "reward_description", GetDescription( RoomReward, rewardPanel ) );

        // add callback 
        (function( nRewardIndex, eRewardType, nRoomDepth )
        {
            rewardPanel.FindChildTraverse( "ConfirmButton" ).SetPanelEvent( 'onactivate', function () { OnRewardClicked( nRewardIndex, eRewardType, nRoomDepth ); } ); 
        })(ii, RoomReward["reward_type"], szCurrentDepth);
    }

    ShowAghanimRewardsHUD( true, false ); 
}


function SetRewardHUDRarity(szRarity)
{

    AghanimRewardsHUD.SetDialogVariable("header_rarity", $.Localize("DOTA_HUD_Reward_Rarity_" + szRarity));

    AghanimRewardsHUD.SetHasClass("CommonRoomRarity", szRarity == "common" || szRarity == "");
    AghanimRewardsHUD.SetHasClass("EliteRoomRarity", szRarity == "elite");
    AghanimRewardsHUD.SetHasClass("LegendaryRoomRarity", szRarity == "epic");
    AghanimRewardsHUD.SetHasClass("StartingRoomRarity", szRarity == "starting");
}



$.Schedule( 1.0, function() { CheckForRewardsHUD( false ) } );