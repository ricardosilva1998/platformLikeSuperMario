var NinjaGirl = Entity.extend(function () {
    this.currState = undefined; // estado atual;

    var podeAtacar = false;
    var maisLento = 0;
    var dir = 1;

    this.le = 0;
    this.ld = 0;
    
    this.states = {
		AttackRight: 'AttackRight',
		AttackLeft: 'AttackLeft',

        ThrowRight: 'ThrowRight',
        ThrowLeft: 'ThrowLeft',

        DeadRight: 'DeadRight',
        DeadLeft: 'DeadLeft',

        IdleRight: 'IdleRight',
        IdleLeft: 'IdleLeft',

        RunRight: 'RunRight',
        RunLeft: 'RunLeft',
    };

    this.sounds = {};

    this.constructor = function (spriteSheet, x, y, le, ld, sounds) {
        this.super();
        this.energia = 100;
        this.x = x;
        this.y = y;
        this.vy = 9;
        this.vx = 9;
        this.spriteSheet = spriteSheet;
        this.currState = this.states.RunRight;
        this.currentFrame = 0;
        this.le = le;
        this.ld = ld;
        this.sounds = sounds;
        setup();
    };

    this.update = function () {
        if (!this.active)
            return;
        
        
        if (maisLento++ % 5 !== 0) return;
            maisLento = 1;
        
            if (this.currState == this.states.DeadRight && this.currentFrame == this.frames.length - 1)
            return;

            if (this.currState == this.states.DeadLeft && this.currentFrame == this.frames.length - 1)
            return;

        this.currentFrame = (++this.currentFrame)%this.frames.length;
        
        this.width = this.frames[this.currentFrame].width*0.2; //atualizar a altura
        this.height = this.frames[this.currentFrame].height*0.2; // atualizar os
        this.updateSize();
        
        if (this.currState === this.states.AttackLeft && this.currentFrame == this.frames.length - 1) {
            this.pararEsq();
        }
        
        if (this.currState === this.states.AttackRight && this.currentFrame == this.frames.length - 1) {
            this.pararDir();
        }
        if (this.currState == this.states.DeadLeft) {
            this.morrerEsq();
            this.active = true;
        }
        if (this.currState == this.states.DeadRight) {
            this.morrerDir();
            this.active = true;
        }

        if(this.right() > this.ld){
            dir = -1;
            this.andarEsq();
        }else if(this.left() < this.le){
            dir = 1;
            this.andarDir();
        }

        this.x += this.vx*dir;
    };

    var setup = function () {			
        this.eStates.RunRight = this.spriteSheet.getStats('RunRight');
        this.eStates.RunLeft = this.spriteSheet.getStats('RunLeft');
        
        this.eStates.ThrowRight = this.spriteSheet.getStats('ThrowRight');
		this.eStates.ThrowLeft = this.spriteSheet.getStats('ThrowLeft');

        this.eStates.AttackRight = this.spriteSheet.getStats('AttackRight');
		this.eStates.AttackLeft = this.spriteSheet.getStats('AttackLeft');

        this.eStates.IdleRight = this.spriteSheet.getStats('IdleRight');
        this.eStates.IdleLeft = this.spriteSheet.getStats('IdleLeft');

        this.eStates.DeadRight = this.spriteSheet.getStats('DeadRight');
        this.eStates.DeadLeft = this.spriteSheet.getStats('DeadLeft');

        this.frames = this.eStates[this.currState];
        this.width = this.frames[0].width; //atualizar a altura
        this.height = this.frames[0].height; // atualizar os
        // atualizar o array de frames atual

    }.bind(this);

    //WALK
    this.andarDir = function () {
        toogleState(this.states.RunRight);
    };
    this.andarEsq = function () {
        toogleState(this.states.RunLeft);
    };

    //IDLE
    this.pararDir = function () {
        toogleState(this.states.IdleRight);
    };
    this.pararEsq = function () {
        toogleState(this.states.IdleLeft);
    };
    
    //DEAD
    this.morrerDir = function () {
        toogleState(this.states.DeadRight);
        this.sounds.DeadRight.play(false,0.5);
        this.y += 4;
    };
    this.morrerEsq = function () {
        toogleState(this.states.DeadLeft);
        this.sounds.DeadLeft.play(false,0.5);
        this.y += 4;
    };

    //ATTACK
    this.atacarDir = function () {
        toogleState(this.states.AttackRight);
        this.sounds.AttackRight.play(false,0.5);
    };
    this.atacarEsq = function () {
        toogleState(this.states.AttackLeft);
        this.sounds.AttackLeft.play(false,0.5);
    };

    //Throw
	this.dispararDir = function () {
		toogleState(this.states.ThrowRight);
	};
	this.dispararEsq = function () {
		toogleState(this.states.ThrowLeft);
	};

    var toogleState = function (theState) {
        if (this.killed)return;
        if (this.currState != theState) {
            this.currState = theState;
            this.frames = this.eStates[theState];
            this.currentFrame = 0;
        }
    }.bind(this);

});