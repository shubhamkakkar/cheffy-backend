const ProgressBar = require('progress');


async function create(Model, data) {
  return await Model.create(data);
}

async function bulkExecute(Model, data) {
  //return await Model.bulkCreate(data);
  const result = data.map(async(singleData) => {
    return await create(Model, singleData);
  });

  return Promise.all(result);
}

function preparation(total) {
  console.time('timeTaken');
  console.log(`Preparing to save ${total} fake data. Please wait for a while.`);
  console.log();
}

module.exports = async function bulkSave({Model, buildModel, total}) {
  let BATCH_SIZE = 10;

  if(total < BATCH_SIZE) {
    BATCH_SIZE = total;
  }

  let bulkData = [];

  preparation(total);

  const progressBar = new ProgressBar('saving [:bar] :percent :etas', {
    complete: '=',
    incomplete: ' ',
    width: 20,
    total: total
  });

  for(let counter=0; counter < total; counter++) {
    const doc = await buildModel(counter);
    bulkData.push(doc);
    if ( counter % BATCH_SIZE === 0) {
      try {
        await bulkExecute(Model, bulkData);
      } catch(e) {
        console.log('failed bulkExecute', e);
      }
      progressBar.tick(BATCH_SIZE);
      //reset bulkData
      bulkData = [];
    }
  }
  return;
}
