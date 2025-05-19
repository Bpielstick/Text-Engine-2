import { scenes, skills, items, creatures, regions, gameConfig } from '../content/data.js';
/** Error used for content validation issues. */
export class ContentError extends Error{
  constructor(message){
    super(message);
    this.name='ContentError';
  }
}

const ID_REGEX=/^[a-z][A-Za-z0-9_]*$/;

function assert(condition,message){
  if(!condition) throw new ContentError(message);
}

export class ContentLoader{
  constructor(){
    this.scenes=new Map();
    this.skills=new Map();
    this.items=new Map();
    this.creatures=new Map();
    this.regions=new Map();
    this.config=undefined;
  }

  async loadAll(){
    // Data is embedded directly as JavaScript objects so the engine can run
    // when opened via the file:// protocol with no local server.
    this.scenes=this.arrayToMap(scenes,'Scene');
    this.skills=this.arrayToMap(skills,'Skill');
    this.items=this.arrayToMap(items,'Item');
    this.creatures=this.arrayToMap(creatures,'Creature');
    this.regions=this.arrayToMap(regions,'Region');
    this.config=gameConfig;
    this.validateCrossReferences();
  }


  arrayToMap(arr,name){
    const map=new Map();
    arr.forEach(obj=>{
      assert(!map.has(obj.id),`${name} id '${obj.id}' duplicated`);
      map.set(obj.id,obj);
    });
    return map;
  }

  validateRandomPool(pool,context){
    pool.forEach((p,index)=>{
      assert(ID_REGEX.test(p.value),`${context} randomPool[${index}] invalid id '${p.value}'`);
      if(p.weight!==undefined){
        assert(Number.isInteger(p.weight)&&p.weight>0,`${context} randomPool[${index}] weight must be positive integer`);
      }
    });
  }

  validateChoice(choice,sceneId){
    const ctx=`Scene '${sceneId}' choice`;
    if(choice.nextScene){
      if(typeof choice.nextScene==='string'){
        assert(this.scenes.has(choice.nextScene),`${ctx} nextScene '${choice.nextScene}' not found`);
      }else{
        this.validateRandomPool(choice.nextScene.randomPool,`${ctx} nextScene`);
        choice.nextScene.randomPool.forEach(p=>{
          assert(this.scenes.has(p.value),`${ctx} nextScene random id '${p.value}' not found`);
        });
      }
    }
    if(choice.encounter){
      if(typeof choice.encounter==='string'){
        assert(this.creatures.has(choice.encounter),`${ctx} encounter '${choice.encounter}' not found`);
      }else if(Array.isArray(choice.encounter)){
        choice.encounter.forEach(id=>{
          assert(this.creatures.has(id),`${ctx} encounter '${id}' not found`);
        });
      }else{
        this.validateRandomPool(choice.encounter.randomPool,`${ctx} encounter`);
        choice.encounter.randomPool.forEach(p=>{
          assert(this.creatures.has(p.value),`${ctx} encounter random id '${p.value}' not found`);
        });
      }
    }
  }

  validateCrossReferences(){
    for(const scene of this.scenes.values()){
      scene.choices.forEach(choice=>this.validateChoice(choice,scene.id));
    }
    for(const creature of this.creatures.values()){
      creature.skills?.forEach(id=>{
        assert(this.skills.has(id),`Creature '${creature.id}' skill '${id}' invalid`);
      });
      creature.drops?.forEach(id=>{
        assert(this.items.has(id),`Creature '${creature.id}' drop '${id}' invalid`);
      });
    }
    for(const region of this.regions.values()){
      region.roomTemplates.forEach(id=>{
        assert(this.scenes.has(id),`Region '${region.id}' roomTemplate '${id}' invalid`);
      });
      region.lootPool?.forEach(id=>{
        assert(this.items.has(id),`Region '${region.id}' lootPool item '${id}' invalid`);
      });
    }
    this.config.startingInventory?.forEach(id=>{
      assert(this.items.has(id),`Config startingInventory item '${id}' invalid`);
    });
    if(this.config.startingEquipment){
      Object.entries(this.config.startingEquipment).forEach(([,id])=>{
        assert(this.items.has(id),`Config startingEquipment item '${id}' invalid`);
      });
    }
    assert(this.scenes.has(this.config.startScene),`Config startScene '${this.config.startScene}' invalid`);
  }

  getScene(id){
    if(!this.scenes.has(id)) throw new ContentError(`Scene '${id}' not found`);
    return this.scenes.get(id);
  }
}

export const contentLoader=new ContentLoader();
export default contentLoader;

