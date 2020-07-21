modifier_bomb_squad_landmine_detonate = class({})

--------------------------------------------------------------------------------

function modifier_bomb_squad_landmine_detonate:OnCreated( kv )
	if IsServer() then
		self.radius = self:GetAbility():GetSpecialValueFor( "detonate_radius" )
		self.damage = self:GetAbility():GetSpecialValueFor( "detonate_damage" )
		self.duration = self:GetRemainingTime()
		self.flExplodeTime = GameRules:GetGameTime() + self.duration - 0.2

		self:StartIntervalThink( 0 )
	end
end


--------------------------------------------------------------

function modifier_bomb_squad_landmine_detonate:DeclareFunctions()
	local funcs =
	{
		MODIFIER_EVENT_ON_DEATH,
	}

	return funcs
end
--------

--------------------------------------------------------------------------------

function modifier_bomb_squad_landmine_detonate:OnIntervalThink()
	if IsServer() then

		local nFXIndex = ParticleManager:CreateParticle( "particles/econ/events/darkmoon_2017/darkmoon_calldown_marker_ring.vpcf", PATTACH_CUSTOMORIGIN, nil )
		ParticleManager:SetParticleControl( nFXIndex, 0, self:GetParent():GetOrigin() )
		ParticleManager:SetParticleControl( nFXIndex, 1, Vector( self.radius, self.radius, self.radius ) )
		ParticleManager:SetParticleControl( nFXIndex, 2, Vector( self:GetRemainingTime() / 6, self:GetRemainingTime() / 6, self:GetRemainingTime() / 6 ) )
		ParticleManager:ReleaseParticleIndex( nFXIndex )

		EmitSoundOn( "Creature_Bomb_Squad.LandMine.Priming", self:GetParent() )
		
		if GameRules:GetGameTime() > self.flExplodeTime then
			self:Detonate()
		end

		self:StartIntervalThink( self:GetRemainingTime() / 3 )

	end
end


--------------------------------------------------------------------------------

function modifier_bomb_squad_landmine_detonate:OnDestroy()
	if IsServer() then
		self:GetParent():ForceKill( false )
	end
end

function modifier_bomb_squad_landmine_detonate:Detonate()
	if IsServer() then
		local enemies = FindUnitsInRadius( self:GetCaster():GetTeamNumber(), self:GetParent():GetOrigin(), self:GetCaster(), self.radius, DOTA_UNIT_TARGET_TEAM_ENEMY, DOTA_UNIT_TARGET_HERO + DOTA_UNIT_TARGET_BASIC, DOTA_UNIT_TARGET_FLAG_NOT_ANCIENTS, 0, false )
		if #enemies > 0 then
			for _,enemy in pairs(enemies) do
				if enemy ~= nil and ( not enemy:IsMagicImmune() ) and ( not enemy:IsInvulnerable() ) then
					local DamageInfo =
					{
						victim = enemy,
						attacker = self:GetCaster(),
						ability = self,
						damage = self.damage,
						damage_type = DAMAGE_TYPE_MAGICAL,
					}
					ApplyDamage( DamageInfo )
				end
			end
		end

		local nFXIndex = ParticleManager:CreateParticle( "particles/units/heroes/hero_techies/techies_land_mine_explode.vpcf", PATTACH_CUSTOMORIGIN, nil )
		ParticleManager:SetParticleControl( nFXIndex, 0, self:GetParent():GetOrigin() )
		ParticleManager:SetParticleControl( nFXIndex, 1, Vector( 1.0, 1.0, self.radius ) )
		ParticleManager:SetParticleControl( nFXIndex, 2, Vector( 1.0, 1.0, self.radius ) )
		ParticleManager:ReleaseParticleIndex( nFXIndex )

		EmitSoundOn( "Creature_Bomb_Squad.LandMine.Detonate", self:GetParent() )
		self:GetParent():ForceKill( false )
	end

end


function modifier_bomb_squad_landmine_detonate:OnDeath( params )
	if IsServer() then
		if params.unit == self:GetParent() then
			params.unit:AddEffects( EF_NODRAW )
		end
	end
end

